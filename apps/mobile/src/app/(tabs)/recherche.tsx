import { CalendarRange, CarFront, CircleAlert, MapPin, Navigation, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { offersTier } from '@front/app/listing/domain/entities/SearchCriteria';
import { listListingsRequested } from '@front/app/listing/domain/use-cases/list-listings/listListingsEpic';
import { locateListingsRequested } from '@front/app/listing/domain/use-cases/locate-listings/locateListingsEpic';
import {
  addressSearchCleared,
  addressSelected,
} from '@front/app/listing/domain/use-cases/search-address/searchAddressEpic';
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
} from '@front/selectors/listing/listingSelectors';

import { AddressSheet } from '../../components/AddressSheet';
import { ListingsMap } from '../../components/ListingsMap';
import { AddressField, Insight, TierChips, VehicleChips } from '../../components/SearchFilters';
import { SearchResultCard } from '../../components/SearchResultCard';
import { EmptyState, Rise, Skeleton, useTabBarSpace } from '../../components/ui/Layout';
import { Segmented } from '../../components/ui/Segmented';
import { Display, Text, Ticket } from '../../components/ui/Text';
import { ApiUnreachable } from '../../components/ApiUnreachable';
import { useSearchCriteria } from '../../lib/searchParams';
import { useAppDispatch, useAppSelector } from '../../store/redux';
import { useTheme } from '../../theme/useTheme';

type Mode = 'list' | 'map';

/**
 * La recherche : la liste porte les faits, la carte porte l'espace, et les
 * deux lisent la même donnée déjà classée par distance
 * (`selectMappedListingsFromSearch`). Sur un téléphone, elles ne tiennent pas
 * côte à côte : un segment bascule de l'une à l'autre.
 */
export default function SearchScreen() {
  const { t } = useTranslation(['listing', 'common', 'mobile']);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();

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
  const vehicleTally = useAppSelector((state) => selectVehicleTally(state, criteria.vehicle));
  const [mode, setMode] = useState<Mode>('list');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);

  const chosenTier = criteria.tier;
  const tierCount = chosenTier === null ? 0 : listings.filter((listing) => offersTier(listing.pricing, chosenTier)).length;

  useEffect(() => {
    if (!listingsLoaded && !listingsLoading && listingsError === null) dispatch(listListingsRequested());
  }, [dispatch, listingsError, listingsLoaded, listingsLoading]);

  useEffect(() => {
    if (listingsLoaded && listings.length > 0) dispatch(locateListingsRequested());
  }, [dispatch, listings.length, listingsLoaded]);

  // Les paramètres de route commandent le point cherché : arriver depuis
  // l'accueil ou revenir sur l'onglet produisent le même état.
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

  const focused = results.find((entry) => entry.listing.id === focusedId) ?? null;

  const header = (
    <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 12, gap: 14 }}>
      {/* Sur la carte, chaque point compte : le titre s'efface devant elle. */}
      {mode === 'list' && (
        <Rise>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color={colors.accent} />
            <Ticket tone="accent">{t('common:footer.city')}</Ticket>
          </View>
          <Display size={32} style={{ marginTop: 8 }}>
            {t('listing:map.title')}
          </Display>
        </Rise>
      )}

      <Rise order={1} style={{ gap: 12 }}>
        <AddressField
          label={criteria.address?.label ?? null}
          onOpen={() => setAddressOpen(true)}
          onClear={() => replaceCriteria({ ...criteria, address: null })}
        />
        <VehicleChips value={criteria.vehicle} onChange={(vehicle) => replaceCriteria({ ...criteria, vehicle })} />
        <TierChips value={criteria.tier} onChange={(tier) => replaceCriteria({ ...criteria, tier })} />
      </Rise>

      {listingsError !== null && <ApiUnreachable message={listingsError} />}

      {(searchPoint !== null || criteria.vehicle !== null || criteria.tier !== null) && (
        <View style={{ gap: 8 }}>
          {searchPoint !== null && (
            <Insight positive={nearby > 0} icon={Navigation}>
              <Text size={13} weight="semibold" style={{ color: nearby > 0 ? colors.ok : colors.fgMuted }}>
                {t('listing:mapSearch.around', { address: searchLabel ?? '' })}
              </Text>
              {' — '}
              {nearby > 0 ? t('listing:mapSearch.nearby', { count: nearby }) : t('listing:mapSearch.noneNearby')}
            </Insight>
          )}
          {criteria.vehicle !== null && (
            <Insight positive={vehicleTally.accepting > 0} icon={CarFront}>
              {vehicleTally.accepting > 0
                ? t('listing:criteria.vehicleFiltered', { count: vehicleTally.accepting })
                : t('listing:criteria.noVehicle')}
              {vehicleTally.undeclared > 0 && ` ${t('listing:criteria.undeclaredKept', { count: vehicleTally.undeclared })}`}
            </Insight>
          )}
          {criteria.tier !== null && (
            <Insight positive={tierCount > 0} icon={CalendarRange}>
              {tierCount > 0 ? t('listing:criteria.tierFiltered', { count: tierCount }) : t('listing:criteria.noTier')}
            </Insight>
          )}
        </View>
      )}

      <Segmented<Mode>
        label={t('listing:map.title')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'list', label: t('listing:map.listTab') },
          { value: 'map', label: t('listing:map.mapTab') },
        ]}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: mode === 'list' ? 2 : 0 }}>
        <Display size={mode === 'list' ? 19 : 15} weight="semibold" tabular>
          {t('listing:map.located', { count: results.length })}
        </Display>
        {approximate > 0 && (
          <Pill tone="warn" icon={<TriangleAlert size={13} color={colors.warn} />} label={t('listing:map.approximate', { count: approximate })} />
        )}
        {unplaced > 0 && (
          <Pill tone="neutral" icon={<CircleAlert size={13} color={colors.fgMuted} />} label={t('listing:map.unplaced', { count: unplaced })} />
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {mode === 'list' ? (
        <FlatList
          data={results}
          keyExtractor={(entry) => entry.listing.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: tabBarSpace, gap: 12 }}
          refreshControl={
            <RefreshControl
              tintColor={colors.accent}
              refreshing={false}
              onRefresh={() => dispatch(listListingsRequested())}
            />
          }
          renderItem={({ item, index }) => (
            <Rise order={index} style={{ paddingHorizontal: 16 }}>
              <SearchResultCard
                listing={item.listing}
                distanceKm={item.distanceKm}
                precision={item.located.precision}
                tier={criteria.tier}
                vehicle={criteria.vehicle}
              />
            </Rise>
          )}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 16, gap: 12 }}>
              {(listingsLoading || locating) && [0, 1, 2].map((slot) => <Skeleton key={slot} height={150} />)}
              {listingsLoaded && listings.length === 0 && <EmptyState title={t('listing:map.empty')} />}
              {listingsLoaded && listings.length > 0 && !locating && results.length === 0 && (
                <EmptyState title={t('listing:map.emptyLocated')} />
              )}
            </View>
          }
          ListFooterComponent={
            results.length > 0 ? (
              <Text size={12} tone="subtle" style={{ paddingHorizontal: 16, marginTop: 4 }}>
                {t('listing:map.attribution')}
              </Text>
            ) : null
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {header}
          <View
            style={{
              flex: 1,
              marginTop: 12,
              marginHorizontal: 16,
              marginBottom: tabBarSpace - 8,
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.bgSunken,
            }}
          >
            <ListingsMap
              mapped={results}
              frame={focus}
              searchPoint={searchPoint}
              searchLabel={searchLabel}
              focusedListingId={focusedId}
              onFocus={setFocusedId}
            />
            {locating && (
              <View
                style={{
                  position: 'absolute',
                  top: 12,
                  alignSelf: 'center',
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: colors.bgRaised,
                }}
              >
                <Text size={12} weight="medium">
                  {t('listing:map.locating')}
                </Text>
              </View>
            )}
            {focused !== null && (
              <Animated.View
                key={focused.listing.id}
                entering={FadeInDown.duration(300)}
                exiting={FadeOutDown.duration(200)}
                style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}
              >
                <SearchResultCard
                  listing={focused.listing}
                  distanceKm={focused.distanceKm}
                  precision={focused.located.precision}
                  tier={criteria.tier}
                  vehicle={criteria.vehicle}
                  focused
                />
              </Animated.View>
            )}
          </View>
        </View>
      )}

      <AddressSheet
        visible={addressOpen}
        initialQuery={criteria.address?.label ?? ''}
        onClose={() => setAddressOpen(false)}
        onSelect={(suggestion) => {
          setAddressOpen(false);
          replaceCriteria({ ...criteria, address: { label: suggestion.label, coordinates: suggestion.coordinates } });
        }}
      />
    </View>
  );
}

const Pill = ({ tone, icon, label }: { tone: 'warn' | 'neutral'; icon: ReactNode; label: string }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: tone === 'warn' ? colors.warnBg : colors.bgSunken,
      }}
    >
      {icon}
      <Text size={12} weight="medium" style={{ color: tone === 'warn' ? colors.warn : colors.fgMuted }}>
        {label}
      </Text>
    </View>
  );
};
