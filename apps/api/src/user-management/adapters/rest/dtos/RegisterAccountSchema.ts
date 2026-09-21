import { Schema } from 'effect/index';

export const RegisterAccountSchema = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});
