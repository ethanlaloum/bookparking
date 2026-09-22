import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { listListingsRequested } from '../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { Notice } from '../components/Notice';
import { ParkingMark } from '../components/ParkingMark';
import { SearchBar } from '../components/SearchBar';
import {
  criteriaToSearchParams,
  EMPTY_CRITERIA,
} from '../app/listing/domain/entities/SearchCriteria';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Skeleton } from '../components/ui/skeleton';
import { formatCents } from '../lib/format';
import {
  selectCheapestRateInCents,
  selectListings,
  selectListingsError,
  selectListingsLoaded,
  selectListingsLoading,
} from '../selectors/listing/listingSelectors';
import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

export const ListingsPage = () => {
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const listings = useAppSelector(selectListings);
  const loading = useAppSelector(selectListingsLoading);
  const loaded = useAppSelector(selectListingsLoaded);
  const error = useAppSelector(selectListingsError);
  const cheapest = useAppSelector(selectCheapestRateInCents);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!loaded && !loading) dispatch(listListingsRequested());
  }, [dispatch, loaded, loading]);

  return (
    <>
      <section className="border-b border-line bg-bg-raised">
        <div className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              <ParkingMark className="size-4" />
              {t('common:brand')}
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.03] font-bold text-fg">
              {t('common:tagline')}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-fg-muted">
              {t('listing:home.pitch')}
            </p>
            {cheapest !== null && (
              <p className="tabular mt-6 flex items-baseline gap-2 text-fg-muted">
                <span className="text-xs tracking-wide uppercase">{t('listing:card.from')}</span>
                <span className="font-display text-3xl font-bold text-fg">
                  {formatCents(cheapest)}
                </span>
                <span className="text-sm">{t('common:unit.perNight')}</span>
              </p>
            )}
          </div>

          <div className="mt-9 rounded-[2px] border border-line-strong bg-bg p-5 shadow-[var(--shadow-panel)] lg:p-6">
            <SearchBar
              initial={EMPTY_CRITERIA}
              submitLabel={t('listing:criteria.search')}
              onSubmit={(criteria) => {
                const params = criteriaToSearchParams(criteria).toString();
                void navigate(params === '' ? '/recherche' : `/recherche?${params}`);
              }}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-fg">{t('listing:list.title')}</h2>
          <Link
            to="/recherche"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {t('listing:map.nav')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>

        </div>

        {error !== null && (
          <Notice tone="error" title={t('common:error.title')} className="mt-6">
            {error}
          </Notice>
        )}

        {loading && (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((slot) => (
              <li key={slot}>
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </li>
            ))}
          </ul>
        )}

        {loaded && listings.length > 0 && (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} index={index} />
            ))}
          </ul>
        )}

        {loaded && listings.length === 0 && (
          <div className="mt-6">
            <EmptyState
              title={listings.length === 0 ? t('listing:list.emptyAll') : t('listing:list.empty')}
              action={
                listings.length === 0 && isAuthenticated ? (
                  <Link to="/publier" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                    {t('listing:list.emptyAction')}
                  </Link>
                ) : undefined
              }
            />
          </div>
        )}
      </section>
    </>
  );
};
