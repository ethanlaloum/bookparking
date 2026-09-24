import { router } from 'expo-router';
import { CalendarRange, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { cheapestNightlyRateInCents } from '@front/app/listing/domain/entities/Listing';
import type { OwnerListing } from '@front/app/listing/domain/ports/ListingGateway';
import {
  rentedNightCount,
  type RentalRequestStatus,
  type RentalRequestView,
} from '@front/app/rental/domain/entities/RentalRequestView';
import { formatCents, formatDay, formatShortDay } from '@front/lib/format';

import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { BayThumbnail } from './art/BayThumbnail';
import { Badge, type BadgeTone } from './ui/Badge';
import { Display, Text } from './ui/Text';

// Typé sur le statut du contrat : un huitième statut côté api cassera la
// compilation ici, comme la table `TONE` du site.
export const STATUS_TONE: Record<RentalRequestStatus, BadgeTone> = {
  AWAITING_PAYMENT: 'neutral',
  PENDING: 'warn',
  CONFIRMED: 'ok',
  EXPIRED: 'neutral',
  CANCELLED: 'danger',
  ABANDONED: 'neutral',
  PAYMENT_FAILED: 'danger',
};

const Separator = () => {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.line, marginLeft: 16 }} />;
};

/** Une liste de lignes dans une carte, séparées par un filet, comme `Card > ul` sur le site. */
export const RowList = <T,>({ items, render, keyOf }: { items: readonly T[]; render: (item: T) => ReactNode; keyOf: (item: T) => string }) => {
  const { colors, shadows } = useTheme();
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.bgRaised,
        boxShadow: shadows.panel,
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => (
        <View key={keyOf(item)}>
          {index > 0 && <Separator />}
          {render(item)}
        </View>
      ))}
    </View>
  );
};

export const RentalRequestRow = ({
  request,
  moneyLabel,
  action,
}: {
  request: RentalRequestView;
  moneyLabel?: string;
  action?: ReactNode;
}) => {
  const { t } = useTranslation('account');
  const { colors } = useTheme();
  const nights = rentedNightCount(request);

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <BayThumbnail box={request.box} width={52} height={64} radius={8} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text size={15} weight="medium" numberOfLines={2}>
            {request.address} · <Text size={14} style={{ fontFamily: fonts.mono.medium }}>{request.box}</Text>
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <CalendarRange size={13} color={colors.fgSubtle} />
              <Text size={12} tone="subtle" tabular>
                {t('row.period', {
                  from: formatShortDay(`${request.fromDay}T00:00:00.000Z`),
                  to: formatShortDay(`${request.toDay}T00:00:00.000Z`),
                })}
              </Text>
            </View>
            <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: colors.bgSunken }}>
              <Text size={12} weight="medium" tone="subtle" tabular>
                {t('row.nights', { count: nights })}
              </Text>
            </View>
          </View>
        </View>
        <Display size={20} tabular>
          {formatCents(request.priceInCents)}
        </Display>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <Badge tone={STATUS_TONE[request.status]} dot label={t(`status.${request.status}`)} />
        {moneyLabel !== undefined && (
          <Text size={13} weight="medium" tone="muted" style={{ flex: 1, minWidth: 160 }}>
            {moneyLabel}
          </Text>
        )}
      </View>

      {action !== undefined && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{action}</View>}
    </View>
  );
};

export const OwnerListingRow = ({ listing }: { listing: OwnerListing }) => {
  const { t } = useTranslation(['account', 'common']);
  const { colors } = useTheme();
  const rate = cheapestNightlyRateInCents(listing.pricing);
  const isActive = listing.status === 'ACTIVE';

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${listing.address} · ${listing.box}`}
      accessibilityHint={t('account:places.open')}
      onPress={() => router.push({ pathname: '/place/[id]', params: { id: listing.id } })}
      style={({ pressed }) => ({ padding: 16, backgroundColor: pressed ? colors.bgSunken : 'transparent' })}
    >
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <BayThumbnail box={listing.box} width={52} height={64} radius={8} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text size={15} weight="medium" numberOfLines={2}>
            {listing.address} · <Text size={14} style={{ fontFamily: fonts.mono.medium }}>{listing.box}</Text>
          </Text>
          <Text size={12} tone="subtle" tabular>
            {formatDay(listing.availability.from)} → {formatDay(listing.availability.to)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <Badge tone={isActive ? 'ok' : 'neutral'} dot label={isActive ? t('account:places.active') : t('account:places.unpublished')} />
            <Display size={17} tabular>
              {rate === null ? '—' : formatCents(rate)}
            </Display>
          </View>
        </View>
        <ChevronRight size={18} color={colors.fgSubtle} />
      </View>
    </Pressable>
  );
};
