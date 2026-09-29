import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Pricing } from '@front/app/listing/domain/entities/Listing';
import { formatCents } from '@front/lib/format';

import { useTheme } from '../theme/useTheme';
import { Display, Ticket } from './ui/Text';

const TIERS = ['day', 'week', 'month'] as const;

const READ: Record<(typeof TIERS)[number], (pricing: Pricing) => number | null> = {
  day: (pricing) => pricing.dayInCents,
  week: (pricing) => pricing.weekInCents,
  month: (pricing) => pricing.monthInCents,
};

/** Trois tickets côte à côte ; un palier absent est hachuré en pointillés, jamais caché. */
export const PricingGrid = ({ pricing }: { pricing: Pricing }) => {
  const { t } = useTranslation('listing');
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {TIERS.map((tier) => {
        const value = READ[tier](pricing);
        const label = t(`pricing.${tier}`);
        return (
          <View
            key={tier}
            accessible
            accessibilityLabel={`${label} : ${value === null ? '—' : formatCents(value)}`}
            style={{
              flex: 1,
              borderRadius: 16,
              borderWidth: 1,
              borderStyle: value === null ? 'dashed' : 'solid',
              borderColor: value === null ? colors.lineStrong : colors.line,
              backgroundColor: value === null ? colors.bgSunken : colors.bgRaised,
              paddingHorizontal: 14,
              paddingVertical: 14,
            }}
          >
            <Ticket>{label}</Ticket>
            <Display size={22} tabular tone={value === null ? 'subtle' : 'fg'} style={{ marginTop: 8 }}>
              {value === null ? t('pricing.none') : formatCents(value)}
            </Display>
          </View>
        );
      })}
    </View>
  );
};
