import { Schema } from 'effect/index';

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;
const MAX_PLACE_LENGTH = 120;
const ISO_DAY_LENGTH = 10;
const MAX_NUMBER_LENGTH = 7;

type Refusal = { message: () => string };

const invalidPlace: Refusal = { message: () => 'Lieu de recherche invalide' };
const invalidDay: Refusal = {
  message: () => 'Une date de recherche doit être écrite AAAA-MM-JJ',
};
const invalidNumber: Refusal = {
  message: () =>
    'Le numéro et la taille de page doivent être des entiers positifs',
};

// `Schema.optional` compose une union avec `undefined` dont la branche `undefined`
// n'est annotable par aucun message : son refus réémet la valeur soumise en clair
// (« Expected undefined, actual "05/10/2026" »). `optionalWith(..., { exact: true })`
// n'engendre pas cette union — voir apps/api/CLAUDE.md.
// La borne de longueur est composée avant le motif : le raffinement composé en premier
// s'exécute en premier, et la regex ne tourne jamais sur une chaîne non bornée.
const optionalText = (
  maxLength: number,
  refusal: Refusal,
  pattern?: RegExp,
) => {
  const bounded = Schema.String.annotations(refusal).pipe(
    Schema.maxLength(maxLength, refusal),
  );
  return Schema.optionalWith(
    pattern === undefined
      ? bounded
      : bounded.pipe(Schema.pattern(pattern, refusal)),
    { exact: true },
  );
};

export const ListListingsQuerySchema = Schema.Struct({
  place: optionalText(MAX_PLACE_LENGTH, invalidPlace),
  from: optionalText(ISO_DAY_LENGTH, invalidDay, ISO_DAY_PATTERN),
  to: optionalText(ISO_DAY_LENGTH, invalidDay, ISO_DAY_PATTERN),
  page: optionalText(
    MAX_NUMBER_LENGTH,
    invalidNumber,
    POSITIVE_INTEGER_PATTERN,
  ),
  size: optionalText(
    MAX_NUMBER_LENGTH,
    invalidNumber,
    POSITIVE_INTEGER_PATTERN,
  ),
}).annotations({
  message: () => 'Paramètres de recherche invalides',
});
