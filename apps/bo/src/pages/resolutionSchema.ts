import { z } from 'zod';

import { centsFromInput, formatCentsPrecisely } from '@front/lib/format';

import {
  isAcceptablePartialRefund,
  maximumPartialRefundInCents,
  type AdminRentalIssue,
  type IssueDecision,
} from '../app/back-office/domain/entities/AdminRentalIssue';
import { i18n } from '../lib/i18n';
import { MINIMUM_REASON_LENGTH } from './moderationSchema';

// Le montant n'est demandé qu'au remboursement partiel, et borné par la part
// du loueur de cette réclamation-là : le schéma se construit donc pour elle.
export const resolutionSchemaFor = (issue: AdminRentalIssue, decision: IssueDecision) =>
  z
    .object({
      amount: z.string(),
      reason: z.string().refine((value) => value.trim().length >= MINIMUM_REASON_LENGTH, {
        message: i18n.t('admin:moderation.validation.reason'),
      }),
    })
    .superRefine((values, context) => {
      if (decision !== 'PARTIAL_REFUND') return;
      const cents = centsFromInput(values.amount);
      if (cents === undefined || !isAcceptablePartialRefund(issue, cents))
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: i18n.t('admin:issues.dialog.amountInvalid', {
            max: formatCentsPrecisely(maximumPartialRefundInCents(issue)),
          }),
        });
    });

export type ResolutionValues = z.infer<ReturnType<typeof resolutionSchemaFor>>;
