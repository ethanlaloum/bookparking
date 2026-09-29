import { Schema } from 'effect/index';

export const DeleteAccountSchema = Schema.Struct({
  password: Schema.String.annotations({
    message: () => 'Mot de passe invalide',
  }).pipe(
    Schema.minLength(1, {
      message: () => 'Saisissez votre mot de passe pour supprimer votre compte',
    }),
  ),
}).annotations({
  message: () => 'Corps de requête invalide pour une suppression de compte',
});
