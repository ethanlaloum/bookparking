import * as Haptics from 'expo-haptics';
import { CalendarRange, MapPin, Search, X, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import {
  RENTAL_TIERS,
  VEHICLE_TYPES,
  type RentalTier,
  type VehicleType,
} from '@front/app/listing/domain/entities/SearchCriteria';

import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';
import { VEHICLE_ICON } from './Vehicles';

/**
 * Le champ d'adresse de la barre de recherche, en bouton : le toucher ouvre la
 * feuille de recherche plein écran. Le ✕ efface l'adresse, pas la recherche
 * entière — même promesse que « Effacer l'adresse » sur le site.
 */
export const AddressField = ({
  label,
  onOpen,
  onClear,
  onInk = false,
}: {
  label: string | null;
  onOpen: () => void;
  onClear?: () => void;
  onInk?: boolean;
}) => {
  const { t } = useTranslation(['listing', 'mobile']);
  const { colors, shadows } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: onInk ? 'rgba(255,255,255,0.12)' : colors.lineStrong,
        backgroundColor: onInk ? '#ffffff' : colors.bgRaised,
        boxShadow: onInk ? '0px 18px 40px -18px rgba(0,0,0,0.8)' : shadows.panel,
      }}
    >
      <Pressable
        accessibilityRole="search"
        accessibilityLabel={t('listing:mapSearch.label')}
        accessibilityValue={label === null ? undefined : { text: label }}
        onPress={onOpen}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: onInk ? '#1f46e0' : colors.accentSoft,
          }}
        >
          {label === null ? <Search size={17} color={onInk ? '#ffffff' : colors.accent} /> : <MapPin size={17} color={onInk ? '#ffffff' : colors.accent} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.mono.medium,
              fontSize: 10,
              lineHeight: 13,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: onInk ? '#5f6d8b' : colors.fgSubtle,
            }}
          >
            {t('mobile:search.field')}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              fontFamily: label === null ? fonts.sans.regular : fonts.sans.semibold,
              fontSize: 15,
              lineHeight: 20,
              color: onInk ? (label === null ? '#5f6d8b' : '#0b0d12') : label === null ? colors.fgSubtle : colors.fg,
            }}
          >
            {label ?? t('listing:mapSearch.placeholder')}
          </Text>
        </View>
      </Pressable>
      {label !== null && onClear !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('listing:mapSearch.clear')}
          onPress={onClear}
          hitSlop={8}
          style={{ padding: 14 }}
        >
          <X size={17} color={onInk ? '#5f6d8b' : colors.fgSubtle} />
        </Pressable>
      )}
    </View>
  );
};

const Chip = ({
  selected,
  label,
  icon: Icon,
  onPress,
}: {
  selected: boolean;
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
        borderRadius: 999,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: selected ? colors.brand : colors.line,
        backgroundColor: selected ? colors.brand : colors.bgRaised,
      }}
    >
      {Icon && <Icon size={15} color={selected ? colors.onBrand : colors.fgMuted} />}
      <Text
        style={{
          fontFamily: selected ? fonts.sans.semibold : fonts.sans.medium,
          fontSize: 13,
          lineHeight: 17,
          color: selected ? colors.onBrand : colors.fgMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const ChipRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    accessibilityRole="radiogroup"
    accessibilityLabel={label}
    contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
    style={{ marginHorizontal: -16, flexGrow: 0 }}
  >
    {children}
  </ScrollView>
);

/** Le sélecteur de véhicule : « Tous véhicules », puis les cinq types du contrat. */
export const VehicleChips = ({ value, onChange }: { value: VehicleType | null; onChange: (vehicle: VehicleType | null) => void }) => {
  const { t } = useTranslation('listing');
  return (
    <ChipRow label={t('criteria.vehicle')}>
      <Chip selected={value === null} label={t('criteria.anyVehicle')} onPress={() => onChange(null)} />
      {VEHICLE_TYPES.map((vehicle) => (
        <Chip
          key={vehicle}
          selected={value === vehicle}
          icon={VEHICLE_ICON[vehicle]}
          label={t(`criteria.vehicleType.${vehicle}`)}
          onPress={() => onChange(vehicle)}
        />
      ))}
    </ChipRow>
  );
};

/** La durée : les trois paliers tarifaires, la seule chose qu'elle filtre vraiment. */
export const TierChips = ({ value, onChange }: { value: RentalTier | null; onChange: (tier: RentalTier | null) => void }) => {
  const { t } = useTranslation('listing');
  return (
    <ChipRow label={t('criteria.duration')}>
      <Chip selected={value === null} icon={CalendarRange} label={t('criteria.anyDuration')} onPress={() => onChange(null)} />
      {RENTAL_TIERS.map((tier) => (
        <Chip key={tier} selected={value === tier} label={t(`criteria.tier.${tier}`)} onPress={() => onChange(tier)} />
      ))}
    </ChipRow>
  );
};

/** Ce que la recherche a retenu, en pastille : elle met en avant, elle ne masque rien. */
export const Insight = ({ positive, icon: Icon, children }: { positive: boolean; icon: LucideIcon; children: ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: positive ? colors.okLine : colors.line,
        backgroundColor: positive ? colors.okBg : colors.bgRaised,
        paddingHorizontal: 12,
        paddingVertical: 9,
      }}
    >
      <Icon size={16} color={positive ? colors.ok : colors.fgMuted} style={{ marginTop: 2 }} />
      <Text size={13} style={{ flex: 1, color: positive ? colors.ok : colors.fgMuted, lineHeight: 19 }}>
        {children}
      </Text>
    </View>
  );
};
