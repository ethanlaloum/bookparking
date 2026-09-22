import { useTranslation } from 'react-i18next';

import { Spinner } from './ui/spinner';

export const Loader = () => {
  const { t } = useTranslation('common');

  return (
    <div role="status" className="flex items-center justify-center gap-2.5 px-4 py-32 text-fg-muted">
      <Spinner />
      {t('state.loading')}
    </div>
  );
};
