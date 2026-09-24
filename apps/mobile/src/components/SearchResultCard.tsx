import { router } from 'expo-router';
import { ArrowRight, CalendarRange, Navigation } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { formatDistance, type LocationPrecision } from '@front/app/listing/domain/entities/Coordinates';
import { cheapestNightlyRateInCents, type Listing } from '@front/app/listing/domain/entities/Listing';
import { priceForTier, type RentalTier, type VehicleType } from '@front/app/listing/domain/entities/SearchCriteria';
import { formatCents, formatDay } from '@front/lib/format';

import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { BayThumbnail } from './art/BayThumbnail';
import { Display, Text } from './ui/Text';
import { VehicleBadges } from './Vehicles';

interface SearchResultCardProps {
  listing: Listing;
  distanceKm: number | null;
  precision: LocationPrecision | null;
  tier: RentalTier | null;
  vehicle: VehicleType | null;
  focused?: boolean;
}

/**
 * La carte de résultat du site : vignette de la place, distance, adresse, box,
 * véhicules, prix au palier cherché. Toute la carte ouvre la fiche — sur un
 * téléphone, le doigt vise la carte, pas le lien « Voir l'annonce ».
 */
export const SearchResultCard = ({ listing, distanceKm, precision, tier, vehicle, focused = false }: SearchResultCardProps) => {
  const { t } = useTranslation(['listing', 'common']);
  const { colors, shadows } = useTheme();
  const [pressed, setPressed] = useState(false);

  const tierPrice = tier === null ? null : priceForTier(listing.pricing, tier);
  const nightly = cheapestNightlyRateInCents(listing.pricing);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${listing.address}, ${t('listing:card.box', { box: listing.box })}`}
      accessibilityHint={t('listing:map.openListing')}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => router.push({ pathname: '/place/[id]', params: { id: listing.id } })}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          gap: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: focused ? colors.brand : pressed ? colors.lineStrong : colors.line,
          backgroundColor: colors.bgRaised,
          padding: 12,
          boxShadow: focused || pressed ? shadows.lift : undefined,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          transitionProperty: ['transform', 'borderColor'],
          transitionDuration: 200,
        }}
      >
        <BayThumbnail box={listing.box} width={84} height={112} />

        <View style={{ flex: 1, minWidth: 0, paddingVertical: 2 }}>
          {(distanceKm !== null || precision === 'approximate') && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {distanceKm !== null && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    backgroundColor: focused ? colors.brand : colors.accentSoft,
                  }}
                >
                  <Navigation size={11} color={focused ? colors.onBrand : colors.accent} />
                  <Text size={12} weight="medium" tabular style={{ lineHeight: 16, color: focused ? colors.onBrand : colors.accent }}>
                    {t('listing:mapSearch.distance', { distance: formatDistance(distanceKm) })}
                  </Text>
                </View>
              )}
              {precision === 'approximate' && (
                <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.warnBg }}>
                  <Text size={12} weight="medium" tone="warn" style={{ lineHeight: 16 }}>
                    {t('listing:map.approx')}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Display size={17} weight="semibold" leading={1.25} numberOfLines={2}>
            {listing.address}
          </Display>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 2, marginTop: 4 }}>
            <Text size={12} tone="muted" style={{ fontFamily: fonts.mono.medium }}>
              {t('listing:card.box', { box: listing.box })}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CalendarRange size={13} color={colors.fgSubtle} />
              <Text size={12} tone="subtle" tabular>
                {t('listing:card.availableUntil', { date: formatDay(listing.availability.to) })}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <VehicleBadges acceptedVehicles={listing.acceptedVehicles} highlighted={vehicle} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, flexShrink: 1 }}>
              {tier !== null ? (
                tierPrice === null ? (
                  <Text size={14} tone="subtle">
                    {t('listing:card.noPrice')}
                  </Text>
                ) : (
                  <>
                    <Display size={22} tabular>
                      {formatCents(tierPrice)}
                    </Display>
                    <Text size={12} tone="subtle">
                      {t(`listing:criteria.tier.${tier}`).toLocaleLowerCase('fr-FR')}
                    </Text>
                  </>
                )
              ) : nightly === null ? (
                <Text size={14} tone="subtle">
                  {t('listing:card.noPrice')}
                </Text>
              ) : (
                <>
                  <Text size={12} tone="subtle">
                    {t('listing:card.from')}
                  </Text>
                  <Display size={22} tabular>
                    {formatCents(nightly)}
                  </Display>
                  <Text size={12} tone="subtle">
                    {t('common:unit.perNight')}
                  </Text>
                </>
              )}
            </View>
            <ArrowRight size={18} color={colors.accent} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};
