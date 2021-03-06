import type { ValidateFunction } from 'ajv';

import type { ISchemaFunction } from '../../../functions/schema';
import type { IFunction, IFunctionContext } from '../../../types';
import * as asyncApi2Schema from '../schemas/schema.asyncapi2.json';

const fakeSchemaObjectId = 'asyncapi2#/definitions/schema';
const asyncApi2SchemaObject = { $ref: fakeSchemaObjectId };

let validator: ValidateFunction;

const buildAsyncApi2SchemaObjectValidator = (schemaFn: ISchemaFunction): ValidateFunction => {
  if (validator !== void 0) {
    return validator;
  }

  const ajv = schemaFn.createAJVInstance({
    allErrors: true,
    strict: false,
  });

  ajv.addSchema(asyncApi2Schema, asyncApi2Schema.$id);

  validator = ajv.compile(asyncApi2SchemaObject);

  return validator;
};

export const asyncApi2PayloadValidation: IFunction<null> = function (
  this: IFunctionContext,
  targetVal,
  _opts,
  paths,
  otherValues,
) {
  const ajvValidationFn = buildAsyncApi2SchemaObjectValidator(this.functions.schema);

  return this.functions.schema(
    targetVal,
    {
      schema: asyncApi2SchemaObject,
      ajv: ajvValidationFn,
      allErrors: true,
    },
    paths,
    otherValues,
  );
};

export default asyncApi2PayloadValidation;
