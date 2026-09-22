import { CircleAlert, MapPin, TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { listListingsRequested } from '../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { locateListingsRequested } from '../app/listing/domain/use-cases/locate-listings/locateListingsEpic';
import { SearchBar } from '../components/SearchBar';
import { useSearchCriteria } from '../hooks/useSearchCriteria';
import { offersTier } from '../app/listing/domain/entities/SearchCriteria';
import { addressSearchCleared, addressSelected } from '../app/listing/domain/use-cases/search-address/searchAddressEpic';
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

export const SearchPage = () => {
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

  const { criteria, replaceCriteria } = useSearchCriteria();

  // Remonter la barre quand l'URL change : elle tient son propre état de
  // saisie, et une nouvelle recherche arrivée par l'historique doit s'y voir.
  const searchParamsKey = `${criteria.address?.label ?? ''}|${criteria.vehicle ?? ''}|${criteria.tier ?? ''}`;

  const chosenTier = criteria.tier;
  const tierCount =
    chosenTier === null
      ? 0
      : listings.filter((listing) => offersTier(listing.pricing, chosenTier)).length;
  const locating = useAppSelector(selectLocating);
  const approximate = useAppSelector(selectApproximateCount);
  const unplaced = useAppSelector(selectUnmappableCount);

  useEffect(() => {
    if (!listingsLoaded && !listingsLoading) dispatch(listListingsRequested());
  }, [dispatch, listingsLoaded, listingsLoading]);

  useEffect(() => {
    if (listingsLoaded && listings.length > 0) dispatch(locateListingsRequested());
  }, [dispatch, listings.length, listingsLoaded]);

  // L'URL commande le point cherché : arriver depuis l'accueil, recharger la
  // page ou remonter dans l'historique produisent tous le même état.
  useEffect(() => {
    if (criteria.address === null) {
      dispatch(addressSearchCleared());
      return;
    }
    dispatch(
      addressSelected({
        id: criteria.address.label,
        label: criteria.address.label,
        coordinates: criteria.address.coordinates,
      }),
    );
  }, [criteria.address, dispatch]);

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

      <div className="mt-7 rounded-[2px] border border-line bg-bg-raised p-5">
        <SearchBar
          key={searchParamsKey}
          initial={criteria}
          submitLabel={t('listing:criteria.search')}
          onSubmit={replaceCriteria}
        />
      </div>

      {criteria.vehicle !== null && (
        <Notice tone="info" className="mt-4">
          {t('listing:criteria.vehicleNotFiltered')}
        </Notice>
      )}

      {criteria.tier !== null && (
        <Notice tone={tierCount > 0 ? 'success' : 'info'} className="mt-3">
          {tierCount > 0
            ? t('listing:criteria.tierFiltered', { count: tierCount })
            : t('listing:criteria.noTier')}
        </Notice>
      )}

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
