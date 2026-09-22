import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ParkingMark } from '../components/ParkingMark';
import { buttonVariants } from '../components/ui/buttonVariants';

export const NotFoundPage = () => {
  const { t } = useTranslation('common');

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center sm:px-6">
      <ParkingMark className="size-12 opacity-40" />
      <h1 className="mt-7 font-display text-3xl font-bold text-fg">{t('error.notFound')}</h1>
      <p className="mt-3 text-fg-muted">{t('error.notFoundBody')}</p>
      <Link to="/" className={`${buttonVariants({ variant: 'primary' })} mt-8`}>
        {t('nav.browse')}
      </Link>
    </div>
  );
};
