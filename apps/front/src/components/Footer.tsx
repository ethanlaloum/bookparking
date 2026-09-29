import { useTranslation } from 'react-i18next';

import { ParkingMark } from './ParkingMark';

export const Footer = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="mt-auto border-t border-line bg-bg-raised">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <ParkingMark className="size-5" />
          <span className="font-display font-semibold text-fg">{t('brand')}</span>
          <span className="text-fg-subtle">— {t('tagline')}</span>
        </p>
        <p className="tabular text-xs text-fg-subtle">
          {new Date().getFullYear()} · {t('brand')}
        </p>
      </div>
    </footer>
  );
};
