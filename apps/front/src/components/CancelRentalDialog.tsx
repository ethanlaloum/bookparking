import { useTranslation } from 'react-i18next';

import { Notice } from './Notice';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';

export interface CancelRentalTarget {
  requestId: string;
  label: string;
  terms: string;
  perspective: 'renter' | 'owner';
}

interface CancelRentalDialogProps {
  target: CancelRentalTarget | null;
  pending: boolean;
  error: string | null;
  onConfirm: (requestId: string) => void;
  onClose: () => void;
}

/**
 * Muette, comme la modale de modération : elle dit ce que l'annulation coûte
 * et rend le geste. Le texte des conditions lui arrive déjà rédigé : c'est
 * `cancellationTermsOf` qui en décide, pas elle.
 */
export const CancelRentalDialog = ({
  target,
  pending,
  error,
  onConfirm,
  onClose,
}: CancelRentalDialogProps) => {
  const { t } = useTranslation(['account', 'common']);
  if (target === null) return null;
  const owner = target.perspective === 'owner';

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
        aria-labelledby="titre-annulation"
        className="animate-rise w-full max-w-lg rounded-3xl border border-line bg-bg-raised p-6 shadow-[var(--shadow-float)] sm:p-7"
      >
        <h2 id="titre-annulation" className="font-display text-2xl font-bold text-fg">
          {t('account:cancel.title')}
        </h2>
        <p className="mt-3 rounded-xl bg-bg-sunken px-3 py-2 text-sm text-fg">{target.label}</p>
        <p className="mt-4 text-sm leading-relaxed text-fg" role="status">
          {target.terms}
        </p>

        {error !== null && (
          <Notice tone="error" title={t('common:error.title')} className="mt-4">
            {error}
          </Notice>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" autoFocus onClick={onClose} disabled={pending}>
            {owner ? t('account:cancel.ownerKeep') : t('account:cancel.keep')}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() => onConfirm(target.requestId)}
          >
            {pending && <Spinner />}
            {owner ? t('account:cancel.ownerConfirm') : t('account:cancel.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};
