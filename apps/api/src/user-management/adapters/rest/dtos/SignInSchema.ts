import { Schema } from 'effect/index';

export const SignInSchema = Schema.Struct({
  email: Schema.String.annotations({
    message: () => 'Adresse e-mail invalide',
  }),
  password: Schema.String.annotations({
    message: () => 'Mot de passe invalide',
  }),
}).annotations({
  message: () => 'Corps de requête invalide pour une connexion',
});
