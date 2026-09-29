import { Schema } from 'effect/index';

// La forme seulement : le motif et le montant sont des règles du domaine
// (`isUsableReason`, `ResolveRentalIssue.resolutionOf`).
export const ResolveRentalIssueSchema = Schema.Struct({
  decision: Schema.Literal('REFUND', 'PARTIAL_REFUND', 'DISMISS'),
  refundInCents: Schema.optional(Schema.NullOr(Schema.Number)),
  reason: Schema.String,
});
