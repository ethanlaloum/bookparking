import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { IssueReport } from '../app/rental/domain/ports/RentalGateway';
import { cn } from '../lib/cn';
import { reportIssueSchema, type ReportIssueValues } from '../pages/rentalIssueSchemas';
import { Notice } from './Notice';
import { Button } from './ui/button';
import { Field } from './ui/field';
import { Textarea } from './ui/input';
import { Spinner } from './ui/spinner';

export interface ReportIssueTarget {
  requestId: string;
  label: string;
}

const REASONS = ['NO_ACCESS', 'PLACE_OCCUPIED', 'OTHER'] as const;

/**
 * Muette, comme la fenêtre d'annulation : elle recueille le motif et les
 * précisions, et rend le geste. Le conducteur est souvent dans la rue, son
 * téléphone à la main — le motif suffit, sauf pour « Autre problème ».
 */
export const ReportIssueDialog = ({
  target,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  target: ReportIssueTarget | null;
  pending: boolean;
  error: string | null;
  onSubmit: (requestId: string, report: IssueReport) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation(['account', 'common']);
  const form = useForm<ReportIssueValues>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: { reason: 'NO_ACCESS', message: '' },
  });
  if (target === null) return null;

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
        aria-labelledby="titre-signalement"
        className="animate-rise max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-bg-raised p-6 shadow-[var(--shadow-float)] sm:p-7"
      >
        <h2 id="titre-signalement" className="font-display text-2xl font-bold text-fg">
          {t('account:issue.title')}
        </h2>
        <p className="mt-3 rounded-xl bg-bg-sunken px-3 py-2 text-sm text-fg">{target.label}</p>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted">{t('account:issue.intro')}</p>

        <form
          noValidate
          onSubmit={(event) =>
            void form.handleSubmit(({ reason, message }) =>
              onSubmit(target.requestId, {
                reason,
                message: message.trim() === '' ? null : message.trim(),
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

          <fieldset>
            <legend className="text-sm font-medium text-fg">{t('account:issue.reasonLabel')}</legend>
            <div className="mt-2 flex flex-col gap-2">
              {REASONS.map((reason) => (
                <label
                  key={reason}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm text-fg transition-colors',
                    'has-[:checked]:border-accent has-[:checked]:bg-accent-soft/40',
                  )}
                >
                  <input
                    type="radio"
                    value={reason}
                    className="size-4 accent-[var(--accent)]"
                    {...form.register('reason')}
                  />
                  {t(`account:issue.reason.${reason}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <Field
            label={t('account:issue.message')}
            hint={t('account:issue.messageHint')}
            error={form.formState.errors.message?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                placeholder={t('account:issue.messagePlaceholder')}
                {...form.register('message')}
              />
            )}
          </Field>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t('account:issue.close')}
            </Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending && <Spinner />}
              {t('account:issue.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
