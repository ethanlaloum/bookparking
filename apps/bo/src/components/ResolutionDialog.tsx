import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Notice } from '@front/components/Notice';
import { Button } from '@front/components/ui/button';
import { Field } from '@front/components/ui/field';
import { Input, Textarea } from '@front/components/ui/input';
import { Spinner } from '@front/components/ui/spinner';
import { centsFromInput, formatCentsPrecisely } from '@front/lib/format';

import {
  maximumPartialRefundInCents,
  type AdminRentalIssue,
  type IssueDecision,
  type IssueResolution,
} from '../app/back-office/domain/entities/AdminRentalIssue';
import { resolutionSchemaFor, type ResolutionValues } from '../pages/resolutionSchema';

export interface ResolutionTarget {
  issue: AdminRentalIssue;
  decision: IssueDecision;
}

/**
 * Muette, comme la modale de modération : elle dit ce que la décision fait de
 * l'argent, demande le motif — et le montant pour un remboursement partiel —,
 * et rend la décision. L'écran la remonte à chaque cible.
 */
export const ResolutionDialog = ({
  target,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  target: ResolutionTarget;
  pending: boolean;
  error: string | null;
  onConfirm: (resolution: IssueResolution) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const schema = useMemo(
    () => resolutionSchemaFor(target.issue, target.decision),
    [target.issue, target.decision],
  );
  const form = useForm<ResolutionValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', reason: '' },
  });
  const partial = target.decision === 'PARTIAL_REFUND';

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-asphalt-950/60 p-4 backdrop-blur-sm sm:items-center"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-decision"
        className="animate-rise w-full max-w-lg rounded-3xl border border-line bg-bg-raised p-6 shadow-[var(--shadow-float)] sm:p-7"
      >
        <h2 id="titre-decision" className="font-display text-2xl font-bold text-fg">
          {t(`admin:issues.dialog.title.${target.decision}`)}
        </h2>
        <p className="mt-3 rounded-xl bg-bg-sunken px-3 py-2 text-sm text-fg">
          {target.issue.address} · {target.issue.box}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-fg">
          {t(`admin:issues.dialog.body.${target.decision}`)}
        </p>

        <form
          noValidate
          onSubmit={(event) =>
            void form.handleSubmit(({ amount, reason }) =>
              onConfirm({
                decision: target.decision,
                refundInCents: partial ? (centsFromInput(amount) ?? null) : null,
                reason: reason.trim(),
              }),
            )(event)
          }
          className="mt-5 flex flex-col gap-4"
        >
          {error !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {error}
            </Notice>
          )}

          {partial && (
            <Field
              label={t('admin:issues.dialog.amount')}
              hint={t('admin:issues.dialog.amountHint', {
                max: formatCentsPrecisely(maximumPartialRefundInCents(target.issue)),
              })}
              error={form.formState.errors.amount?.message}
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  inputMode="decimal"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className="tabular w-40"
                  {...form.register('amount')}
                />
              )}
            </Field>
          )}

          <Field
            label={t('admin:moderation.reason')}
            hint={t('admin:moderation.reasonHint')}
            error={form.formState.errors.reason?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                placeholder={t('admin:moderation.reasonPlaceholder')}
                {...form.register('reason')}
              />
            )}
          </Field>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t('common:action.cancel')}
            </Button>
            <Button
              type="submit"
              variant={target.decision === 'DISMISS' ? 'primary' : 'danger'}
              disabled={pending}
            >
              {pending && <Spinner />}
              {t('admin:issues.dialog.confirm')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
