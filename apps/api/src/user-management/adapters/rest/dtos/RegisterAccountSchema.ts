import { Schema } from 'effect/index';

const EMAIL_PATTERN = /^[^\s@'"\\;]+@[^\s@]+\.[^\s@]+$/u;
const MAX_EMAIL_LENGTH = 254;

export const RegisterAccountSchema = Schema.Struct({
  email: Schema.String.annotations({
    message: () => 'Adresse e-mail invalide',
  }).pipe(
    Schema.pattern(EMAIL_PATTERN, {
      message: () => 'Adresse e-mail invalide',
    }),
    Schema.maxLength(MAX_EMAIL_LENGTH, {
      message: () => 'Adresse e-mail invalide',
    }),
  ),
  password: Schema.String.annotations({
    message: () => 'Mot de passe invalide',
  }).pipe(
    Schema.minLength(8, {
      message: () => 'Le mot de passe doit contenir au moins 8 caractères',
    }),
  ),
}).annotations({
  message: () => 'Corps de requête invalide pour une inscription',
});
