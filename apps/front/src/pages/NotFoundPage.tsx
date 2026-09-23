import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { NoParkingSign } from '../components/art/NoParkingSign';
import { buttonVariants } from '../components/ui/buttonVariants';

export const NotFoundPage = () => {
  const { t } = useTranslation('common');

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="relative">
        <NoParkingSign className="size-36 drop-shadow-[0_20px_30px_rgb(0_0_0/0.25)] transition-transform duration-500 ease-[var(--ease-spring)] hover:rotate-12" />
        <span
          aria-hidden="true"
          className="tabular absolute -top-3 -right-10 rotate-12 rounded-lg bg-highlight px-2.5 py-1 font-mono text-sm font-bold text-asphalt-950 shadow-[var(--shadow-lift)]"
        >
          404
        </span>
      </div>
      <p className="label-ticket mt-10 text-danger">{t('error.notFoundSign')}</p>
      <h1 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-bold text-fg">
        {t('error.notFound')}
      </h1>
      <p className="mt-4 text-lg text-fg-muted">{t('error.notFoundBody')}</p>
      <Link to="/recherche" className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-10`}>
        {t('nav.browse')}
        <ArrowRight className="size-5" aria-hidden="true" />
      </Link>
    </div>
  );
};
