import { Cache } from '@stoplight/json-ref-resolver';
import { ICache, IUriParser } from '@stoplight/json-ref-resolver/types';
import { extname, join } from '@stoplight/path';
import { Optional } from '@stoplight/types';
import { readFile, readParsable } from '../fs/reader';
import { createHttpAndFileResolver, IHttpAndFileResolverOptions } from '../resolvers/http-and-file';
import { FileRulesetSeverity, IRuleset, RulesetFunctionCollection } from '../types/ruleset';
import { findFile, isNPMSource } from './utils';
import { mergeFormats, mergeFunctions, mergeRules } from './mergers';
import { mergeExceptions } from './mergers/exceptions';
import { assertValidRuleset, isValidRule } from './validation';
import { parseYaml } from '../parsers';

export interface IRulesetReadOptions extends IHttpAndFileResolverOptions {
  timeout?: number;
}

function parseContent(content: string, source: string): unknown {
  if (extname(source) === '.json') {
    return JSON.parse(content);
  }

  return parseYaml(content).data;
}

export async function readRuleset(uris: string | string[], opts?: IRulesetReadOptions): Promise<IRuleset> {
  const base: IRuleset = {
    rules: {},
    functions: {},
    exceptions: {},
  };

  const processedRulesets = new Set<string>();
  const processRuleset = createRulesetProcessor(processedRulesets, new Cache(), opts);

  for (const uri of Array.isArray(uris) ? new Set([...uris]) : [uris]) {
    processedRulesets.clear(); // makes sure each separate ruleset starts with clear list
    const resolvedRuleset = await processRuleset(uri, uri);
    if (resolvedRuleset === null) continue;
    Object.assign(base.rules, resolvedRuleset.rules);
    Object.assign(base.functions, resolvedRuleset.functions);
    Object.assign(base.exceptions, resolvedRuleset.exceptions);

    if (resolvedRuleset.parserOptions !== void 0 && !('parserOptions' in base)) {
      base.parserOptions = resolvedRuleset.parserOptions;
    }
  }

  return base;
}

const createRulesetProcessor = (
  processedRulesets: Set<string>,
  uriCache: ICache,
  readOpts: Optional<IRulesetReadOptions>,
) => {
  return async function processRuleset(
    baseUri: string,
    uri: string,
    severity: FileRulesetSeverity = 'recommended',
  ): Promise<IRuleset | null> {
    const rulesetUri = await findFile(join(baseUri, '..'), uri);
    if (processedRulesets.has(rulesetUri)) {
      return null;
    }

    processedRulesets.add(rulesetUri);
    const content = await readParsable(rulesetUri, {
      timeout: readOpts?.timeout,
      encoding: 'utf8',
      agent: readOpts?.agent,
    });

    if (content.trim().length === 0) {
      throw new Error('Ruleset must not empty');
    }

    const resolved = await createHttpAndFileResolver({ agent: readOpts?.agent }).resolve(
      parseContent(content, rulesetUri),
      {
        baseUri: rulesetUri,
        dereferenceInline: false,
        uriCache,
        transformRef(opts) {
          const host = opts.ref?.host();
          if (host === 'json-schema.org') {
            return;
          }

          return opts.ref;
        },
        parseResolveResult(opts): Promise<IUriParser> {
          opts.result = parseContent(opts.result, opts.targetAuthority.href());
          return Promise.resolve(opts);
        },
      },
    );

    const result: unknown = resolved.result;

    const ruleset = assertValidRuleset(JSON.parse(JSON.stringify(result)));
    const rules = {};
    const functions = {};
    const exceptions = {};
    const newRuleset: IRuleset = {
      rules,
      functions,
      exceptions,
      ...('parserOptions' in ruleset ? { parserOptions: ruleset.parserOptions } : null),
    };

    const extendedRulesets = ruleset.extends;
    const rulesetFunctions = ruleset.functions;

    if (extendedRulesets !== void 0) {
      for (const extended of Array.isArray(extendedRulesets) ? extendedRulesets : [extendedRulesets]) {
        let extendedRuleset: IRuleset | null;
        let parentSeverity: FileRulesetSeverity = severity;
        if (Array.isArray(extended)) {
          parentSeverity = extended[1];
          extendedRuleset = await processRuleset(rulesetUri, extended[0], extended[1]);
        } else {
          extendedRuleset = await processRuleset(rulesetUri, extended, parentSeverity);
        }

        if (extendedRuleset !== null) {
          mergeRules(rules, extendedRuleset.rules, parentSeverity);
          Object.assign(functions, extendedRuleset.functions);
          mergeExceptions(exceptions, extendedRuleset.exceptions, baseUri);
        }
      }
    }

    if (ruleset.rules !== void 0) {
      mergeRules(rules, ruleset.rules, severity);

      if (ruleset.documentationUrl !== void 0) {
        for (const [name, rule] of Object.entries(ruleset.rules)) {
          if (isValidRule(rule) && rule.documentationUrl === void 0) {
            newRuleset.rules[name].documentationUrl = `${ruleset.documentationUrl}#${name}`;
          }
        }
      }
    }

    if (ruleset.except !== void 0) {
      mergeExceptions(exceptions, ruleset.except, baseUri);
    }

    if (Array.isArray(ruleset.formats)) {
      mergeFormats(rules, ruleset.formats);
    }

    if (rulesetFunctions !== void 0) {
      const rulesetFunctionsBaseDir = join(
        rulesetUri,
        isNPMSource(rulesetUri) ? '.' : '..',
        ruleset.functionsDir !== void 0 ? ruleset.functionsDir : 'functions',
      );
      const resolvedFunctions: RulesetFunctionCollection = {};

      await Promise.all(
        rulesetFunctions.map(async fn => {
          const fnName = Array.isArray(fn) ? fn[0] : fn;
          const fnSchema = Array.isArray(fn) ? fn[1] : null;
          const source = await findFile(rulesetFunctionsBaseDir, `./${fnName}.js`);

          resolvedFunctions[fnName] = {
            name: fnName,
            code: await readFile(source, {
              timeout: readOpts?.timeout,
              encoding: 'utf8',
              agent: readOpts?.agent,
            }),
            schema: fnSchema,
            source,
          };
        }),
      );

      mergeFunctions(functions, resolvedFunctions, rules);
    }

    return newRuleset;
  };
};
