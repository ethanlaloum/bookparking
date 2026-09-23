import {
  CalendarRange,
  CarFront,
  CircleAlert,
  MapPin,
  Navigation,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
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
import { cn } from '../lib/cn';
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
  selectVehicleTally,
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
  const vehicleTally = useAppSelector((state) =>
    selectVehicleTally(state, criteria.vehicle),
  );
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
    <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-4 sm:px-6">
      <div className="animate-rise flex flex-col gap-1">
        <p className="label-ticket flex items-center gap-2 text-accent">
          <MapPin className="size-3.5" aria-hidden="true" />
          {t('common:footer.city')}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3rem)] leading-none font-bold text-fg">
          {t('listing:map.title')}
        </h1>
        <p className="mt-2 text-fg-muted">{t('listing:map.subtitle')}</p>
      </div>

      <SearchBar
        key={barKey}
        className="animate-rise relative z-20 mt-6 shadow-[var(--shadow-lift)] [--i:1]"
        initial={criteria}
        submitLabel={t('listing:criteria.search')}
        onSubmit={replaceCriteria}
      />

      {listingsError !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-4">
          {listingsError}
        </Notice>
      )}

      {/* Ce que la recherche a retenu, en pastilles : chacune dit ce qu'elle
          met en avant, aucune ne masque quoi que ce soit. */}
      <div className="mt-4 flex flex-wrap gap-2 empty:hidden">
        {searchPoint !== null && (
          <Insight positive={nearby > 0} icon={Navigation}>
            <span className="font-semibold">
              {t('listing:mapSearch.around', { address: searchLabel ?? '' })}
            </span>
            {' — '}
            {nearby > 0
              ? t('listing:mapSearch.nearby', { count: nearby })
              : t('listing:mapSearch.noneNearby')}
          </Insight>
        )}
        {criteria.vehicle !== null && (
          <Insight positive={vehicleTally.accepting > 0} icon={CarFront}>
            {vehicleTally.accepting > 0
              ? t('listing:criteria.vehicleFiltered', { count: vehicleTally.accepting })
              : t('listing:criteria.noVehicle')}
            {vehicleTally.undeclared > 0 && (
              <>
                {' '}
                {t('listing:criteria.undeclaredKept', { count: vehicleTally.undeclared })}
              </>
            )}
          </Insight>
        )}
        {criteria.tier !== null && (
          <Insight positive={tierCount > 0} icon={CalendarRange}>
            {tierCount > 0
              ? t('listing:criteria.tierFiltered', { count: tierCount })
              : t('listing:criteria.noTier')}
          </Insight>
        )}
      </div>

      {/*
       * La liste porte les faits, la carte porte l'espace. Elles partagent la
       * même donnée déjà classée par distance : ce que l'œil lit à gauche est
       * dans le même ordre que ce que la main atteint à droite. La liste suit
       * le défilement de la page ; la carte, collée, reste sous la main.
       */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
        <section aria-label={t('listing:list.title')} className="min-w-0">
          <div className="tabular flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-display text-xl font-semibold text-fg">
              {t('listing:map.located', { count: results.length })}
            </span>
            {approximate > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-bg px-2.5 py-1 text-xs font-medium text-warn">
                <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                {t('listing:map.approximate', { count: approximate })}
              </span>
            )}
            {unplaced > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-sunken px-2.5 py-1 text-xs font-medium text-fg-muted">
                <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                {t('listing:map.unplaced', { count: unplaced })}
              </span>
            )}
          </div>

          {(listingsLoading || locating) && results.length === 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {[0, 1, 2].map((slot) => (
                <Skeleton key={slot} className="h-40" />
              ))}
            </div>
          )}

          {listingsLoaded && listings.length === 0 && (
            <div className="mt-4">
              <EmptyState title={t('listing:map.empty')} />
            </div>
          )}

          {results.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3">
              {results.map(({ listing, located, distanceKm }, index) => (
                <SearchResultCard
                  key={listing.id}
                  revealOrder={index}
                  listing={listing}
                  distanceKm={distanceKm}
                  precision={located.precision}
                  tier={criteria.tier}
                  vehicle={criteria.vehicle}
                  focused={focusedId === listing.id}
                  onFocus={() => setFocusedId(listing.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <section
          aria-label={t('listing:map.nav')}
          className="min-w-0 lg:sticky lg:top-20"
        >
          <div className="relative h-[60vh] overflow-hidden rounded-3xl border border-line bg-bg-sunken shadow-[var(--shadow-lift)] lg:h-[calc(100dvh-6.5rem)]">
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
              <div className="grid h-full place-items-center p-6">
                <EmptyState title={t('listing:map.empty')} />
              </div>
            )}
            {locating && (
              <p className="absolute top-4 left-1/2 z-[500] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-bg-raised px-3.5 py-2 text-xs font-medium text-fg shadow-[var(--shadow-lift)]">
                <span className="size-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                {t('listing:map.locating')}
              </p>
            )}
          </div>
          <p className="mt-3 text-xs text-fg-subtle">{t('listing:map.attribution')}</p>
        </section>
      </div>
    </div>
  );
};

const Insight = ({
  positive,
  icon: Icon,
  children,
}: {
  positive: boolean;
  icon: LucideIcon;
  children: ReactNode;
}) => (
  <p
    role="status"
    className={cn(
      'animate-fade inline-flex max-w-full items-start gap-2 rounded-2xl border px-3.5 py-2 text-sm',
      positive ? 'border-ok/25 bg-ok-bg text-ok' : 'border-line bg-bg-raised text-fg-muted',
    )}
  >
    <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <span className="min-w-0">{children}</span>
  </p>
);
