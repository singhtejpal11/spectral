import { FetchMockSandbox } from 'fetch-mock';

import { isNimmaEnvVariableSet } from './src/utils/isNimmaEnvVariableSet';

const oasRuleset = JSON.parse(JSON.stringify(require('./rulesets/oas/index.json')));
const oasFunctions = JSON.parse(JSON.stringify(require('./__karma__/__fixtures__/oas-functions.json')));
const asyncApiRuleset = JSON.parse(JSON.stringify(require('./rulesets/asyncapi/index.json')));
const asyncApiFunctions = JSON.parse(JSON.stringify(require('./__karma__/__fixtures__/asyncapi-functions.json')));
const asyncApi2Schema = JSON.parse(JSON.stringify(require('./rulesets/asyncapi/schemas/schema.asyncapi2.json')));

const { fetch } = window;
let fetchMock: FetchMockSandbox;

beforeEach(() => {
  fetchMock = require('fetch-mock').default.sandbox();
  fetchMock.catch((url, _opts) => {
    console.warn(`Url '${url}' hasn't been found. Have you forgotten to mock it in 'setupKarma.ts'?`);
    return 404;
  });

  window.fetch = fetchMock;

  fetchMock.get('https://unpkg.com/@stoplight/spectral/rulesets/oas/index.json', {
    status: 200,
    body: JSON.parse(JSON.stringify(oasRuleset)),
  });

  fetchMock.get('https://unpkg.com/@stoplight/spectral/rulesets/asyncapi/index.json', {
    status: 200,
    body: JSON.parse(JSON.stringify(asyncApiRuleset)),
  });

  fetchMock.get('https://unpkg.com/@stoplight/spectral/rulesets/asyncapi/schemas/schema.asyncapi2.json', {
    status: 200,
    body: JSON.parse(JSON.stringify(asyncApi2Schema)),
  });

  [
    ['oas', oasFunctions],
    ['asyncapi', asyncApiFunctions],
  ].forEach(([rulesetName, funcs]) => {
    for (const [name, fn] of Object.entries<string>(funcs)) {
      fetchMock.get(`https://unpkg.com/@stoplight/spectral/rulesets/${rulesetName}/functions/${name}`, {
        status: 200,
        body: fn,
      });
    }
  });
});

afterEach(() => {
  window.fetch = fetch;
});

console.info(`Nimma rule optimizer activated: ${isNimmaEnvVariableSet()}`);
