import { Schema } from 'effect/index';

const MINIMUM_PASSWORD_LENGTH = 8;

export const ChangePasswordSchema = Schema.Struct({
  currentPassword: Schema.String.annotations({
    message: () => 'Mot de passe actuel invalide',
  }),
  newPassword: Schema.String.annotations({
    message: () => 'Nouveau mot de passe invalide',
  }).pipe(
    Schema.minLength(MINIMUM_PASSWORD_LENGTH, {
      message: () => 'Le mot de passe doit contenir au moins 8 caractères',
    }),
  ),
}).annotations({
  message: () => 'Corps de requête invalide pour un changement de mot de passe',
});
