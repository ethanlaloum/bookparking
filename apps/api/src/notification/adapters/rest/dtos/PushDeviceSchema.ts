import { Schema } from 'effect/index';

const INVALID_TOKEN =
  'Jeton de notification invalide : un jeton Expo est attendu';

// `ExponentPushToken[…]` ou `ExpoPushToken[…]`, tel que le rend
// `getExpoPushTokenAsync`. La borne de longueur passe avant le motif, et
// chaque étage porte son message : aucun ne recopie la valeur soumise.
export const PushTokenSchema = Schema.String.annotations({
  message: () => INVALID_TOKEN,
})
  .pipe(Schema.maxLength(200))
  .annotations({ message: () => INVALID_TOKEN })
  .pipe(Schema.pattern(/^Expo(?:nent)?PushToken\[[A-Za-z0-9_-]+\]$/u))
  .annotations({ message: () => INVALID_TOKEN });

export const PushDeviceSchema = Schema.Struct({
  token: PushTokenSchema,
}).annotations({
  message: () => 'Corps de requête invalide pour un téléphone à notifier',
});
