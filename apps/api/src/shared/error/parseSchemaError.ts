import { ParseResult } from 'effect/index';

export const parseSchemaError = (left: ParseResult.ParseError) =>
  ParseResult.ArrayFormatter.formatErrorSync(left)
    .map((error) => `${error.path}: ${error.message}`)
    .toString();
