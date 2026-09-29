import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { deleteAccountSchema, type DeleteAccountValues } from '../pages/deleteAccountSchema';
import { Notice } from './Notice';
import { Button } from './ui/button';
import { Field } from './ui/field';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';

interface DeleteAccountDialogProps {
  open: boolean;
  pending: boolean;
  error: string | null;
  onConfirm: (password: string) => void;
  onClose: () => void;
}

/**
 * Muette, comme la modale d'annulation : elle redemande le mot de passe et le
 * rend. Le refus de l'api (mot de passe faux, location en cours) s'y affiche
 * tel quel.
 */
export const DeleteAccountDialog = ({
  open,
  pending,
  error,
  onConfirm,
  onClose,
}: DeleteAccountDialogProps) => {
  const { t } = useTranslation(['account', 'common']);
  const form = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  const { reset } = form;
  // Un mot de passe ne reste pas dans un champ caché d'une ouverture à l'autre.
  useEffect(() => {
    if (open) reset({ password: '' });
  }, [open, reset]);

  if (!open) return null;

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-asphalt-950/60 p-4 backdrop-blur-sm sm:items-center"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !pending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-suppression"
        className="animate-rise w-full max-w-lg rounded-3xl border border-line bg-bg-raised p-6 shadow-[var(--shadow-float)] sm:p-7"
      >
        <h2 id="titre-suppression" className="font-display text-2xl font-bold text-fg">
          {t('account:deletion.dialogTitle')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-fg">{t('account:deletion.dialogBody')}</p>

        <form
          noValidate
          onSubmit={(event) =>
            void form.handleSubmit((values) => onConfirm(values.password))(event)
          }
          className="mt-5 flex flex-col gap-4"
        >
          {error !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {error}
            </Notice>
          )}

          <Field
            label={t('account:deletion.password')}
            error={form.formState.errors.password?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                autoFocus
                aria-describedby={describedBy}
                aria-invalid={invalid}
                type="password"
                autoComplete="current-password"
                {...form.register('password')}
              />
            )}
          </Field>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t('account:deletion.keep')}
            </Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending && <Spinner />}
              {t('account:deletion.confirm')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
