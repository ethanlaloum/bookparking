import { Schema } from 'effect/index';

const MAX_EMAIL_LENGTH = 254;
const MAX_TOKEN_LENGTH = 128;
const MINIMUM_PASSWORD_LENGTH = 8;

const INVALID_EMAIL = 'Adresse e-mail invalide';
const INVALID_TOKEN = 'Lien de réinitialisation invalide';

export const RequestPasswordResetSchema = Schema.Struct({
  email: Schema.String.annotations({ message: () => INVALID_EMAIL }).pipe(
    Schema.maxLength(MAX_EMAIL_LENGTH, { message: () => INVALID_EMAIL }),
  ),
}).annotations({
  message: () =>
    'Corps de requête invalide pour une demande de réinitialisation',
});

export const ResetPasswordSchema = Schema.Struct({
  token: Schema.String.annotations({ message: () => INVALID_TOKEN }).pipe(
    Schema.maxLength(MAX_TOKEN_LENGTH, { message: () => INVALID_TOKEN }),
  ),
  newPassword: Schema.String.annotations({
    message: () => 'Nouveau mot de passe invalide',
  }).pipe(
    Schema.minLength(MINIMUM_PASSWORD_LENGTH, {
      message: () => 'Le mot de passe doit contenir au moins 8 caractères',
    }),
  ),
}).annotations({
  message: () => 'Corps de requête invalide pour une réinitialisation',
});
