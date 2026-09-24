import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { cn } from '../lib/cn';
import { ParkingMark } from './ParkingMark';

export const BrandLink = ({ className }: { className?: string }) => {
  const { t } = useTranslation('common');

  return (
    <Link to="/" className={cn('group flex items-center gap-2.5 rounded-lg', className)}>
      <ParkingMark className="size-8 transition-transform duration-300 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-105" />
      <span className="font-display text-[1.1rem] font-bold tracking-[-0.03em] sm:text-[1.2rem]">
        {t('brand')}
      </span>
    </Link>
  );
};
