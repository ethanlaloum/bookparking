import { useTranslation } from 'react-i18next';

import { ParkingMark } from './ParkingMark';

export const Loader = () => {
  const { t } = useTranslation('common');

  return (
    <div role="status" className="flex flex-col items-center justify-center gap-4 px-4 py-32 text-sm text-fg-muted">
      <span className="relative grid place-items-center">
        <span aria-hidden="true" className="animate-pulse-ring absolute inset-0 rounded-[10px] bg-brand/40" />
        <ParkingMark className="relative size-10" />
      </span>
      {t('state.loading')}
    </div>
  );
};
