import { Schema } from 'effect/index';

const PRICE_MESSAGE = 'Un prix doit être un nombre entier de centimes';

// Le type de base et le raffinement portent chacun leur annotation : sans celle
// du type de base, un prix envoyé en chaîne retombe sur le message par défaut
// d'`effect`, qui recopie la valeur soumise dans la réponse 400.
const priceInCents = Schema.Number.annotations({
  message: () => PRICE_MESSAGE,
})
  .pipe(Schema.int())
  .annotations({ message: () => PRICE_MESSAGE });

// `exact: true` rend le champ facultatif *sans* composer d'union avec
// `undefined` : un palier absent est absent, et un palier présent est jugé par
// le seul `priceInCents`. Sans cette option, `Schema.optional` ajoute une
// branche `undefined` dont l'échec porte le message par défaut d'`effect`,
// `Expected undefined, actual "..."`, qui recopie la valeur soumise dans la 400.
const optionalPriceInCents = Schema.optionalWith(priceInCents, {
  exact: true,
});

export const UpdateListingPricingSchema = Schema.Struct({
  dayInCents: optionalPriceInCents,
  weekInCents: optionalPriceInCents,
  monthInCents: optionalPriceInCents,
}).annotations({
  message: () => 'Corps de requête invalide pour une grille tarifaire',
});
