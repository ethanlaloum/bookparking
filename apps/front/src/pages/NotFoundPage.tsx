import { ArrowRight, House, SquarePlus } from 'lucide-react';
import { useEffect, type CSSProperties } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  criteriaToSearchParams,
  EMPTY_CRITERIA,
} from '../app/listing/domain/entities/SearchCriteria';
import { NoParkingSign } from '../components/art/NoParkingSign';
import { SearchBar } from '../components/SearchBar';
import { buttonVariants } from '../components/ui/buttonVariants';

const stagger = (index: number): CSSProperties => ({ '--i': index }) as CSSProperties;

/**
 * Une application monopage répond 200 à toutes les adresses : pour un moteur
 * de recherche, cette page serait une page comme une autre. `noindex` est la
 * seule façon, côté navigateur, de lui dire de ne pas la garder. Le titre de
 * l'onglet change aussi, pour que l'historique et les favoris le disent.
 */
const useNotFoundDocument = (title: string): void => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);
    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, [title]);
};

export const NotFoundPage = () => {
  const { t } = useTranslation(['common', 'listing']);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useNotFoundDocument(t('error.notFoundDocumentTitle'));

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-24">
      <div className="animate-rise relative" style={stagger(0)}>
        <NoParkingSign className="size-36 drop-shadow-[0_20px_30px_rgb(0_0_0/0.25)] transition-transform duration-500 ease-[var(--ease-spring)] hover:rotate-12" />
        <span
          aria-hidden="true"
          className="tabular absolute -top-3 -right-10 rotate-12 rounded-lg bg-highlight px-2.5 py-1 font-mono text-sm font-bold text-asphalt-950 shadow-[var(--shadow-lift)]"
        >
          404
        </span>
      </div>

      <p className="animate-rise label-ticket mt-10 text-danger" style={stagger(1)}>
        {t('error.notFoundSign')}
      </p>
      <h1
        className="animate-rise mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-bold text-fg"
        style={stagger(2)}
      >
        {t('error.notFound')}
      </h1>
      <p className="animate-rise mt-4 max-w-xl text-lg text-fg-muted" style={stagger(3)}>
        {t('error.notFoundBody')}{' '}
        <Trans
          t={t}
          i18nKey="error.notFoundPath"
          values={{ path: pathname }}
          components={{
            path: (
              <code className="rounded-md bg-bg-sunken px-1.5 py-0.5 font-mono text-[0.85em] break-all text-fg" />
            ),
          }}
        />
      </p>

      <div className="animate-rise mt-12 w-full text-left" style={stagger(4)}>
        <p className="mb-3 text-center text-sm text-fg-subtle">{t('error.notFoundSearch')}</p>
        <SearchBar
          initial={EMPTY_CRITERIA}
          submitLabel={t('listing:criteria.search')}
          onSubmit={(criteria) => {
            const params = criteriaToSearchParams(criteria).toString();
            void navigate(params === '' ? '/recherche' : `/recherche?${params}`);
          }}
        />
      </div>

      <nav
        aria-label={t('error.notFoundElsewhere')}
        className="animate-rise mt-10 flex flex-wrap justify-center gap-3"
        style={stagger(5)}
      >
        <Link to="/" className={buttonVariants({ variant: 'outline' })}>
          <House className="size-4" aria-hidden="true" />
          {t('error.notFoundHome')}
        </Link>
        <Link to="/recherche" className={buttonVariants({ variant: 'outline' })}>
          {t('nav.browse')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link to="/publier" className={buttonVariants({ variant: 'ghost' })}>
          <SquarePlus className="size-4" aria-hidden="true" />
          {t('nav.publish')}
        </Link>
      </nav>
    </div>
  );
};
