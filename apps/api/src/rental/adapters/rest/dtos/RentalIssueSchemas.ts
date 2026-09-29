import { Schema } from 'effect/index';

// La forme seulement : la longueur du message, et son obligation pour
// « Autre », sont des règles du domaine (`reportIssue`, `checkOwnerReply`).
export const ReportRentalIssueSchema = Schema.Struct({
  reason: Schema.Literal('NO_ACCESS', 'PLACE_OCCUPIED', 'OTHER'),
  message: Schema.optional(Schema.NullOr(Schema.String)),
});

export const AnswerRentalIssueSchema = Schema.Struct({
  reply: Schema.String,
});
