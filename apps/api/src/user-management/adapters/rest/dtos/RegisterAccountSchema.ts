import { Schema } from 'effect/index';

const EMAIL_PATTERN = /^[^\s@'"\\;]+@[^\s@]+\.[^\s@]+$/u;
const MAX_EMAIL_LENGTH = 254;

// SPEC-007 RG-03. Chaque type de base et chaque raffinement porte son message :
// sans lui, `effect` recopierait la valeur soumise dans la 400 (voir CLAUDE.md).
const PROOF_MESSAGE = 'Preuve anti-robot invalide';
const MAX_PROOF_FIELD_LENGTH = 128;
const MAX_PROOF_NUMBER = 1_000_000;

const ProofText = Schema.String.annotations({
  message: () => PROOF_MESSAGE,
}).pipe(
  Schema.maxLength(MAX_PROOF_FIELD_LENGTH, { message: () => PROOF_MESSAGE }),
);

const HumanProofSchema = Schema.Struct({
  algorithm: ProofText,
  challenge: ProofText,
  salt: ProofText,
  number: Schema.Number.annotations({ message: () => PROOF_MESSAGE }).pipe(
    Schema.int({ message: () => PROOF_MESSAGE }),
    Schema.between(0, MAX_PROOF_NUMBER, { message: () => PROOF_MESSAGE }),
  ),
  signature: ProofText,
}).annotations({ message: () => PROOF_MESSAGE });

export const RegisterAccountSchema = Schema.Struct({
  email: Schema.String.annotations({
    message: () => 'Adresse e-mail invalide',
  }).pipe(
    Schema.maxLength(MAX_EMAIL_LENGTH, {
      message: () => 'Adresse e-mail invalide',
    }),
    Schema.pattern(EMAIL_PATTERN, {
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
  humanProof: HumanProofSchema,
  // SPEC-008 : un booléen, dont la valeur est jugée par `RegisterAccount`.
  acceptsTerms: Schema.Boolean.annotations({
    message: () => "Acceptation des conditions d'utilisation invalide",
  }),
}).annotations({
  message: () => 'Corps de requête invalide pour une inscription',
});
