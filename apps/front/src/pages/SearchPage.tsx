import { CircleAlert, MapPin, TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { offersTier } from '../app/listing/domain/entities/SearchCriteria';
import { listListingsRequested } from '../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { locateListingsRequested } from '../app/listing/domain/use-cases/locate-listings/locateListingsEpic';
import {
  addressSearchCleared,
  addressSelected,
} from '../app/listing/domain/use-cases/search-address/searchAddressEpic';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { Notice } from '../components/Notice';
import { SearchBar } from '../components/SearchBar';
import { SearchResultCard } from '../components/SearchResultCard';
import { Skeleton } from '../components/ui/skeleton';
import { useSearchCriteria } from '../hooks/useSearchCriteria';
import {
  selectApproximateCount,
  selectListings,
  selectListingsError,
  selectListingsLoaded,
  selectListingsLoading,
  selectLocating,
  selectMapFocus,
  selectMappedListingsFromSearch,
  selectNearbyCount,
  selectSearchLabel,
  selectSearchPoint,
  selectUnmappableCount,
} from '../selectors/listing/listingSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

const ListingsMap = lazy(async () => ({
  default: (await import('../components/ListingsMap')).ListingsMap,
}));

export const SearchPage = () => {
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();

  const listings = useAppSelector(selectListings);
  const listingsLoaded = useAppSelector(selectListingsLoaded);
  const listingsLoading = useAppSelector(selectListingsLoading);
  const listingsError = useAppSelector(selectListingsError);

  const results = useAppSelector(selectMappedListingsFromSearch);
  const focus = useAppSelector(selectMapFocus);
  const searchPoint = useAppSelector(selectSearchPoint);
  const searchLabel = useAppSelector(selectSearchLabel);
  const nearby = useAppSelector(selectNearbyCount);
  const locating = useAppSelector(selectLocating);
  const approximate = useAppSelector(selectApproximateCount);
  const unplaced = useAppSelector(selectUnmappableCount);

  const { criteria, replaceCriteria } = useSearchCriteria();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const barKey = `${criteria.address?.label ?? ''}|${criteria.vehicle ?? ''}|${criteria.tier ?? ''}`;

  const chosenTier = criteria.tier;
  const tierCount =
    chosenTier === null
      ? 0
      : listings.filter((listing) => offersTier(listing.pricing, chosenTier)).length;

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
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2.5 font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-fg">
        <MapPin className="size-6 shrink-0 text-accent" aria-hidden="true" />
        {t('listing:map.title')}
      </h1>

      <div className="mt-5 rounded-[2px] border border-line bg-bg-raised p-5">
        <SearchBar
          key={barKey}
          initial={criteria}
          submitLabel={t('listing:criteria.search')}
          onSubmit={replaceCriteria}
        />
      </div>

      {listingsError !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-4">
          {listingsError}
        </Notice>
      )}
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
        <Notice tone={nearby > 0 ? 'success' : 'info'} className="mt-3">
          <span className="font-medium">
            {t('listing:mapSearch.around', { address: searchLabel ?? '' })}
          </span>
          {' — '}
          {nearby > 0
            ? t('listing:mapSearch.nearby', { count: nearby })
            : t('listing:mapSearch.noneNearby')}
        </Notice>
      )}

      {/*
       * La liste porte les faits, la carte porte l'espace. Elles partagent la
       * même donnée déjà classée par distance : ce que l'œil lit à gauche est
       * dans le même ordre que ce que la main atteint à droite.
       */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <section aria-label={t('listing:list.title')} className="min-w-0">
          <div className="tabular flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-medium text-fg">
              {t('listing:map.located', { count: results.length })}
            </span>
            {approximate > 0 && (
              <span className="flex items-center gap-1.5 text-warn">
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                {t('listing:map.approximate', { count: approximate })}
              </span>
            )}
            {unplaced > 0 && (
              <span className="flex items-center gap-1.5 text-fg-subtle">
                <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                {t('listing:map.unplaced', { count: unplaced })}
              </span>
            )}
          </div>

          {(listingsLoading || locating) && results.length === 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {[0, 1, 2].map((slot) => (
                <Skeleton key={slot} className="h-32" />
              ))}
            </div>
          )}

          {listingsLoaded && listings.length === 0 && (
            <div className="mt-4">
              <EmptyState title={t('listing:map.empty')} />
            </div>
          )}

          {results.length > 0 && (
            <ul className="mt-4 flex max-h-[62vh] flex-col gap-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-14rem)]">
              {results.map(({ listing, located, distanceKm }) => (
                <SearchResultCard
                  key={listing.id}
                  listing={listing}
                  distanceKm={distanceKm}
                  precision={located.precision}
                  tier={criteria.tier}
                  focused={focusedId === listing.id}
                  onFocus={() => setFocusedId(listing.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-label={t('listing:map.nav')} className="min-w-0 lg:sticky lg:top-24">
          {listings.length > 0 ? (
            <Suspense fallback={<Loader />}>
              <ListingsMap
                mapped={results}
                center={focus.center}
                zoom={focus.zoom}
                searchPoint={searchPoint}
                searchLabel={searchLabel}
                focusedListingId={focusedId}
              />
            </Suspense>
          ) : (
            <EmptyState title={t('listing:map.empty')} />
          )}
          <p className="mt-3 text-xs text-fg-subtle">{t('listing:map.attribution')}</p>
        </section>
      </div>
    </div>
  );
};
