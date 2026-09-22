import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { ModerationTarget } from '../hooks/useModeration';
import { moderationSchema, type ModerationValues } from '../pages/moderationSchema';
import { Notice } from './Notice';
import { Button } from './ui/button';
import { Field } from './ui/field';
import { Textarea } from './ui/input';
import { Spinner } from './ui/spinner';

interface ModerationDialogProps {
  target: ModerationTarget | null;
  pending: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const COPY_KEY = {
  unpublish: 'unpublish',
  suspend: 'suspend',
  lift: 'lift',
  cancelRequest: 'cancelRequest',
} as const;

/**
 * Muette : elle ne connaît ni le store ni les epics. Elle demande un motif, et
 * le rend. C'est `useModeration` qui sait ce qu'il faut en faire — la même
 * modale sert donc les quatre actions des trois listes.
 */
export const ModerationDialog = ({
  target,
  pending,
  error,
  onConfirm,
  onClose,
}: ModerationDialogProps) => {
  const { t } = useTranslation(['admin', 'common']);
  const form = useForm<ModerationValues>({
    resolver: zodResolver(moderationSchema),
    defaultValues: { reason: '' },
  });

  const { reset } = form;
  // Un motif ne se recopie pas d'une cible à l'autre : le champ repart vide à
  // chaque ouverture, faute de quoi la justification d'une annonce se
  // retrouverait attachée au compte suivant.
  useEffect(() => {
    if (target !== null) reset({ reason: '' });
  }, [target, reset]);

  if (target === null) return null;

  const copy = COPY_KEY[target.kind];
  const destructive = target.kind !== 'lift';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-asphalt-950/55 p-4 sm:items-center"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-moderation"
        className="animate-rise w-full max-w-lg rounded-[2px] border border-line bg-bg-raised p-6 shadow-[var(--shadow-lift)]"
      >
        <h2 id="titre-moderation" className="font-display text-xl font-semibold text-fg">
          {t(`admin:moderation.${copy}.title`)}
        </h2>
        <p className="mt-2 text-sm text-fg-muted">{t(`admin:moderation.${copy}.body`)}</p>
        <p className="mt-1 text-sm font-medium text-fg">
          {t('admin:moderation.target', { target: target.label })}
        </p>

        <form
          noValidate
          onSubmit={(event) =>
            void form.handleSubmit((values) => onConfirm(values.reason.trim()))(event)
          }
          className="mt-5 flex flex-col gap-4"
        >
          {error !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {error}
            </Notice>
          )}

          <Field
            label={t('admin:moderation.reason')}
            hint={t('admin:moderation.reasonHint')}
            error={form.formState.errors.reason?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                autoFocus
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
            <Button type="submit" variant={destructive ? 'danger' : 'primary'} disabled={pending}>
              {pending && <Spinner />}
              {t('admin:moderation.confirm')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
