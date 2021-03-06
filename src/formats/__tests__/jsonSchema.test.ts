import {
  isJSONSchema,
  isJSONSchemaDraft2019_09,
  isJSONSchemaDraft2020_12,
  isJSONSchemaDraft4,
  isJSONSchemaDraft6,
  isJSONSchemaDraft7,
  isJSONSchemaLoose,
} from '../jsonSchema';

describe('JSON Schema format', () => {
  describe('JSON Schema strict', () => {
    it.each([
      'http://json-schema.org/schema#',
      'https://json-schema.org/schema#',
      'http://json-schema.org/hyper-schema#',
      'http://json-schema.org/draft-04/schema#',
      'http://json-schema.org/draft-04/hyper-schema#',
      'http://json-schema.org/draft-06/schema#',
      'http://json-schema.org/draft-06/hyper-schema#',
    ])('recognizes %s schema correctly', $schema => {
      expect(isJSONSchema({ $schema })).toBe(true);
    });

    it('does not recognize invalid document', () => {
      expect(isJSONSchema({ $schema: '2.0' })).toBe(false);
      expect(isJSONSchema({ $schema: 'json-schema' })).toBe(false);
      expect(isJSONSchema({ $schema: 2 })).toBe(false);
      expect(isJSONSchema({ swagger: null })).toBe(false);
      expect(isJSONSchema({ allOf: [] })).toBe(false);
      expect(isJSONSchema({ type: 'string' })).toBe(false);
      expect(isJSONSchema({})).toBe(false);
      expect(isJSONSchema(null)).toBe(false);
    });
  });

  describe('JSON Schema loose', () => {
    describe('by $schema', () => {
      it.each([
        'http://json-schema.org/schema#',
        'https://json-schema.org/schema#',
        'http://json-schema.org/hyper-schema#',
        'http://json-schema.org/draft-04/schema#',
        'http://json-schema.org/draft-04/hyper-schema#',
        'http://json-schema.org/draft-06/schema#',
        'http://json-schema.org/draft-06/hyper-schema#',
      ])('recognizes %s schema correctly', $schema => {
        expect(isJSONSchemaLoose({ $schema })).toBe(true);
      });
    });

    describe('by type', () => {
      it.each(['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'])(
        'recognizes %s type correctly',
        type => {
          expect(isJSONSchemaLoose({ type })).toBe(true);
        },
      );

      it.each(['foo', 'bar', 1, 2, void 0, null])('does not recognize invalid %s type', type => {
        expect(isJSONSchemaLoose({ type })).toBe(false);
      });
    });

    describe('by combiner', () => {
      it.each(['allOf', 'oneOf', 'anyOf'])('recognizes %s combiner correctly', combiner => {
        expect(isJSONSchemaLoose({ [combiner]: [] })).toBe(true);
      });

      it.each(['allOf', 'oneOf', 'anyOf'])('does not %s combiner that is not an object', combiner => {
        expect(isJSONSchemaLoose({ [combiner]: void 0 })).toBe(false);
        expect(isJSONSchemaLoose({ [combiner]: 0 })).toBe(false);
        expect(isJSONSchemaLoose({ [combiner]: '' })).toBe(false);
        expect(isJSONSchemaLoose({ [combiner]: null })).toBe(false);
      });
    });

    it('recognizes by the presence of "not"', () => {
      expect(isJSONSchemaLoose({ not: {} })).toBe(true);
    });

    describe('mixed', () => {
      it('invalid type but valid combiner', () => {
        expect(isJSONSchemaLoose({ type: 'foo', allOf: [] })).toBe(true);
      });

      it('valid type but invalid combiner', () => {
        expect(isJSONSchemaLoose({ type: 'string', allOf: null })).toBe(true);
      });
    });
  });

  describe('JSON Schema Draft 4', () => {
    it.each([
      'http://json-schema.org/draft-04/schema#',
      'https://json-schema.org/draft-04/schema#',
      'http://json-schema.org/draft-04/schema',
      'https://json-schema.org/draft-04/schema',
      'http://json-schema.org/draft-04/hyper-schema#',
      'https://json-schema.org/draft-04/hyper-schema#',
      'http://json-schema.org/draft-04/hyper-schema',
      'https://json-schema.org/draft-04/hyper-schema',
    ])('recognizes %s schema correctly', $schema => {
      expect(isJSONSchemaDraft4({ $schema })).toBe(true);
    });

    it.each([
      'http://json-schema.org/schema#',
      'https://json-schema.org/schema#',
      'http://json-schema.org/hyper-schema#',
      'http://json-schema.org/draft-06/schema#',
      'http://json-schema.org/draft-06/hyper-schema#',
    ])('does not recognize %s schema', $schema => {
      expect(isJSONSchemaDraft4({ $schema })).toBe(false);
    });

    it('does not recognize invalid document', () => {
      expect(isJSONSchemaDraft4({ $schema: '2.0' })).toBe(false);
      expect(isJSONSchemaDraft4({ $schema: 'json-schema' })).toBe(false);
      expect(isJSONSchemaDraft4({ $schema: 2 })).toBe(false);
      expect(isJSONSchemaDraft4({ swagger: null })).toBe(false);
      expect(isJSONSchemaDraft4({ allOf: [] })).toBe(false);
      expect(isJSONSchemaDraft4({ type: 'string' })).toBe(false);
      expect(isJSONSchemaDraft4({})).toBe(false);
      expect(isJSONSchemaDraft4(null)).toBe(false);
    });
  });
  describe('JSON Schema Draft 6', () => {
    it.each([
      'http://json-schema.org/draft-06/schema#',
      'https://json-schema.org/draft-06/schema#',
      'http://json-schema.org/draft-06/schema',
      'https://json-schema.org/draft-06/schema',
      'http://json-schema.org/draft-06/hyper-schema#',
      'https://json-schema.org/draft-06/hyper-schema#',
      'http://json-schema.org/draft-06/hyper-schema',
      'https://json-schema.org/draft-06/hyper-schema',
    ])('recognizes %s schema correctly', $schema => {
      expect(isJSONSchemaDraft6({ $schema })).toBe(true);
    });

    it.each([
      'http://json-schema.org/schema#',
      'https://json-schema.org/schema#',
      'http://json-schema.org/hyper-schema#',
      'http://json-schema.org/draft-04/schema#',
      'http://json-schema.org/draft-04/hyper-schema#',
    ])('does not recognize %s schema', $schema => {
      expect(isJSONSchemaDraft6({ $schema })).toBe(false);
    });

    it('does not recognize invalid document', () => {
      expect(isJSONSchemaDraft6({ $schema: '2.0' })).toBe(false);
      expect(isJSONSchemaDraft6({ $schema: 'json-schema' })).toBe(false);
      expect(isJSONSchemaDraft6({ $schema: 2 })).toBe(false);
      expect(isJSONSchemaDraft6({ swagger: null })).toBe(false);
      expect(isJSONSchemaDraft6({ allOf: [] })).toBe(false);
      expect(isJSONSchemaDraft6({ type: 'string' })).toBe(false);
      expect(isJSONSchemaDraft6({})).toBe(false);
      expect(isJSONSchemaDraft6(null)).toBe(false);
    });
  });

  describe('JSON Schema Draft 7', () => {
    it.each([
      'http://json-schema.org/draft-07/schema#',
      'https://json-schema.org/draft-07/schema#',
      'http://json-schema.org/draft-07/schema',
      'https://json-schema.org/draft-07/schema',
      'http://json-schema.org/draft-07/hyper-schema#',
      'https://json-schema.org/draft-07/hyper-schema#',
      'http://json-schema.org/draft-07/hyper-schema',
      'https://json-schema.org/draft-07/hyper-schema',
    ])('recognizes %s schema correctly', $schema => {
      expect(isJSONSchemaDraft7({ $schema })).toBe(true);
    });

    it.each([
      'http://json-schema.org/schema#',
      'https://json-schema.org/schema#',
      'http://json-schema.org/hyper-schema#',
      'http://json-schema.org/draft-06/schema#',
      'http://json-schema.org/draft-06/hyper-schema#',
    ])('does not recognize %s schema', $schema => {
      expect(isJSONSchemaDraft7({ $schema })).toBe(false);
    });

    it('does not recognize invalid document', () => {
      expect(isJSONSchemaDraft7({ $schema: '2.0' })).toBe(false);
      expect(isJSONSchemaDraft7({ $schema: 'json-schema' })).toBe(false);
      expect(isJSONSchemaDraft7({ $schema: 2 })).toBe(false);
      expect(isJSONSchemaDraft7({ swagger: null })).toBe(false);
      expect(isJSONSchemaDraft7({ allOf: [] })).toBe(false);
      expect(isJSONSchemaDraft7({ type: 'string' })).toBe(false);
      expect(isJSONSchemaDraft7({})).toBe(false);
      expect(isJSONSchemaDraft7(null)).toBe(false);
    });
  });

  describe.each<[string, (document: unknown) => boolean]>([
    ['2019-09', isJSONSchemaDraft2019_09],
    ['2020-12', isJSONSchemaDraft2020_12],
  ])('JSON Schema Draft %s', (draft, fn) => {
    it.each([
      `http://json-schema.org/draft/${draft}/schema#`,
      `https://json-schema.org/draft/${draft}/schema#`,
      `http://json-schema.org/draft/${draft}/schema`,
      `https://json-schema.org/draft/${draft}/schema`,
      `http://json-schema.org/draft/${draft}/hyper-schema#`,
      `https://json-schema.org/draft/${draft}/hyper-schema#`,
      `http://json-schema.org/draft/${draft}/hyper-schema`,
      `https://json-schema.org/draft/${draft}/hyper-schema`,
    ])('recognizes %s schema correctly', $schema => {
      expect(fn({ $schema })).toBe(true);
    });

    it.each([
      'http://json-schema.org/schema#',
      'https://json-schema.org/schema#',
      'http://json-schema.org/hyper-schema#',
      'http://json-schema.org/draft-06/schema#',
      'http://json-schema.org/draft-06/hyper-schema#',
    ])('does not recognize %s schema', $schema => {
      expect(fn({ $schema })).toBe(false);
    });

    it('does not recognize invalid document', () => {
      expect(fn({ $schema: '2.0' })).toBe(false);
      expect(fn({ $schema: 'json-schema' })).toBe(false);
      expect(fn({ $schema: 2 })).toBe(false);
      expect(fn({ swagger: null })).toBe(false);
      expect(fn({ allOf: [] })).toBe(false);
      expect(fn({ type: 'string' })).toBe(false);
      expect(fn({})).toBe(false);
      expect(fn(null)).toBe(false);
    });
  });
});
