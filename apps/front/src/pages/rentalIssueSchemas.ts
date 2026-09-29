import { z } from 'zod';

import {
  ISSUE_TEXT_MAXIMUM_LENGTH,
  ISSUE_TEXT_MINIMUM_LENGTH,
} from '../app/rental/domain/entities/RentalRequestView';
import { i18n } from '../lib/i18n';

// Report des règles de l'api (`reportIssue`, `checkOwnerReply`) : le motif
// suffit, sauf pour « Autre », qui demande quelques mots. L'api reste le juge.
export const reportIssueSchema = z
  .object({
    reason: z.enum(['NO_ACCESS', 'PLACE_OCCUPIED', 'OTHER']),
    message: z
      .string()
      .max(ISSUE_TEXT_MAXIMUM_LENGTH, { message: i18n.t('account:issue.validation.tooLong') }),
  })
  .superRefine((values, context) => {
    if (values.reason === 'OTHER' && values.message.trim().length < ISSUE_TEXT_MINIMUM_LENGTH)
      context.addIssue({
        code: 'custom',
        path: ['message'],
        message: i18n.t('account:issue.validation.message'),
      });
  });

export type ReportIssueValues = z.infer<typeof reportIssueSchema>;

export const answerIssueSchema = z.object({
  reply: z
    .string()
    .refine((value) => value.trim().length >= ISSUE_TEXT_MINIMUM_LENGTH, {
      message: i18n.t('account:issue.validation.message'),
    })
    .refine((value) => value.trim().length <= ISSUE_TEXT_MAXIMUM_LENGTH, {
      message: i18n.t('account:issue.validation.tooLong'),
    }),
});

export type AnswerIssueValues = z.infer<typeof answerIssueSchema>;
