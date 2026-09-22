import { CircleAlert, MapPin, TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { listListingsRequested } from '../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { locateListingsRequested } from '../app/listing/domain/use-cases/locate-listings/locateListingsEpic';
import { AddressSearch } from '../components/AddressSearch';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { Notice } from '../components/Notice';
import { buttonVariants } from '../components/ui/buttonVariants';
import {
  selectApproximateCount,
  selectListings,
  selectListingsLoaded,
  selectListingsLoading,
  selectLocating,
  selectMapFocus,
  selectMappedListings,
  selectMappedListingsFromSearch,
  selectNearbyCount,
  selectSearchLabel,
  selectSearchPoint,
  selectUnmappableCount,
} from '../selectors/listing/listingSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

// Leaflet pèse lourd et n'a de sens que sur cet écran : il arrive dans son
// propre morceau, pas dans le paquet que charge la page d'accueil.
const ListingsMap = lazy(async () => ({
  default: (await import('../components/ListingsMap')).ListingsMap,
}));

export const MapPage = () => {
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();

  const listings = useAppSelector(selectListings);
  const listingsLoaded = useAppSelector(selectListingsLoaded);
  const listingsLoading = useAppSelector(selectListingsLoading);
  const mapped = useAppSelector(selectMappedListings);
  const focus = useAppSelector(selectMapFocus);
  const fromSearch = useAppSelector(selectMappedListingsFromSearch);
  const searchPoint = useAppSelector(selectSearchPoint);
  const searchLabel = useAppSelector(selectSearchLabel);
  const nearby = useAppSelector(selectNearbyCount);
  const locating = useAppSelector(selectLocating);
  const approximate = useAppSelector(selectApproximateCount);
  const unplaced = useAppSelector(selectUnmappableCount);

  useEffect(() => {
    if (!listingsLoaded && !listingsLoading) dispatch(listListingsRequested());
  }, [dispatch, listingsLoaded, listingsLoading]);

  useEffect(() => {
    if (listingsLoaded && listings.length > 0) dispatch(locateListingsRequested());
  }, [dispatch, listings.length, listingsLoaded]);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-fg">
            <MapPin className="size-7 shrink-0 text-accent" aria-hidden="true" />
            {t('listing:map.title')}
          </h1>
          <p className="mt-2 text-fg-muted">{t('listing:map.subtitle')}</p>
        </div>
        <Link to="/" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          {t('listing:map.listTab')}
        </Link>
      </div>

      <div className="mt-7 max-w-xl">
        <AddressSearch />
      </div>

      {searchPoint !== null && (
        <Notice tone={nearby > 0 ? 'success' : 'info'} className="mt-5">
          <span className="font-medium">
            {t('listing:mapSearch.around', { address: searchLabel ?? '' })}
          </span>
          {' — '}
          {nearby > 0
            ? t('listing:mapSearch.nearby', { count: nearby })
            : t('listing:mapSearch.noneNearby')}
        </Notice>
      )}

      <div className="tabular mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted">
        <span className="font-medium text-fg">
          {t('listing:map.located', { count: mapped.length })}
        </span>
        {approximate > 0 && (
          <span className="flex items-center gap-1.5 text-warn">
            <TriangleAlert className="size-4" aria-hidden="true" />
            {t('listing:map.approximate', { count: approximate })}
          </span>
        )}
        {unplaced > 0 && (
          <span className="flex items-center gap-1.5 text-fg-subtle">
            <CircleAlert className="size-4" aria-hidden="true" />
            {t('listing:map.unplaced', { count: unplaced })}
          </span>
        )}
      </div>

      {locating && (
        <Notice tone="info" className="mt-4">
          {t('listing:map.locating')}
        </Notice>
      )}
      {!locating && listings.length > 0 && mapped.length === 0 && (
        <Notice tone="info" className="mt-4">
          {t('listing:map.emptyLocated')}
        </Notice>
      )}
      {approximate > 0 && (
        <Notice tone="info" className="mt-4">
          {t('listing:map.approximateHint')}
        </Notice>
      )}
      {unplaced > 0 && (
        <Notice tone="info" className="mt-3">
          {t('listing:map.unplacedHint')}
        </Notice>
      )}

      <div className="mt-6">
        {listingsLoading && <Loader />}

        {listingsLoaded && listings.length === 0 && (
          <EmptyState title={t('listing:map.empty')} />
        )}

        {listings.length > 0 && (
          <Suspense fallback={<Loader />}>
            <ListingsMap
              mapped={fromSearch}
              center={focus.center}
              zoom={focus.zoom}
              searchPoint={searchPoint}
              searchLabel={searchLabel}
            />
          </Suspense>
        )}
      </div>

      <p className="mt-4 text-xs text-fg-subtle">{t('listing:map.attribution')}</p>
    </div>
  );
};
