import { ShieldCheck, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Spinner } from './ui/spinner';

/**
 * La preuve anti-robot de SPEC-007 RG-03 se calcule seule, sans rien à cocher :
 * cette ligne dit seulement où elle en est.
 */
export const HumanCheck = ({ ready, failed }: { ready: boolean; failed: boolean }) => {
  const { t } = useTranslation('auth');

  return (
    <p role="status" className="flex items-center gap-2 text-sm text-fg-muted">
      {ready ? (
        <>
          <ShieldCheck className="size-4 text-ok" aria-hidden="true" />
          {t('human.ready')}
        </>
      ) : failed ? (
        <>
          <TriangleAlert className="size-4 text-danger" aria-hidden="true" />
          {t('human.failed')}
        </>
      ) : (
        <>
          <Spinner />
          {t('human.pending')}
        </>
      )}
    </p>
  );
};
