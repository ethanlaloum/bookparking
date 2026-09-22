import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ParkingMark } from './ParkingMark';

export const BrandLink = () => {
  const { t } = useTranslation('common');

  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-[2px]">
      <ParkingMark className="size-7" />
      <span className="font-display text-lg font-semibold tracking-tight text-fg">
        {t('brand')}
      </span>
    </Link>
  );
};
