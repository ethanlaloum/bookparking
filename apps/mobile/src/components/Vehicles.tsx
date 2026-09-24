import { Bike, Car, Motorbike, PlugZap, Truck, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { VEHICLE_TYPES, type VehicleType } from '@front/app/listing/domain/entities/SearchCriteria';

import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';

// Une icône par type, et une seule source — la même table que le site
// (`VEHICLE_ICON`), dessinée par la même bibliothèque.
export const VEHICLE_ICON: Record<VehicleType, LucideIcon> = {
  velo: Bike,
  moto: Motorbike,
  voiture: Car,
  electrique: PlugZap,
  utilitaire: Truck,
};

const isVehicleType = (value: string): value is VehicleType =>
  (VEHICLE_TYPES as readonly string[]).includes(value);

/**
 * Le silence se dit, il ne se cache pas : une annonce qui n'a rien déclaré
 * affiche « non précisé » plutôt que rien du tout, sans quoi un conducteur
 * croirait qu'elle n'accepte aucun véhicule.
 */
export const VehicleBadges = ({
  acceptedVehicles,
  highlighted = null,
}: {
  acceptedVehicles: readonly string[];
  highlighted?: VehicleType | null;
}) => {
  const { t } = useTranslation('listing');
  const { colors } = useTheme();
  const known = acceptedVehicles.filter(isVehicleType);

  if (known.length === 0)
    return (
      <Text size={12} tone="subtle" style={{ fontStyle: 'italic' }}>
        {t('criteria.notDeclared')}
      </Text>
    );

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {known.map((vehicle) => {
        const Icon = VEHICLE_ICON[vehicle];
        const marked = highlighted === vehicle;
        return (
          <View
            key={vehicle}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: marked ? colors.brand : colors.line,
              backgroundColor: marked ? colors.brand : colors.bgSunken,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Icon size={14} color={marked ? colors.onBrand : colors.fgMuted} />
            <Text size={12} style={{ lineHeight: 14, color: marked ? colors.onBrand : colors.fgMuted }}>
              {t(`criteria.vehicleType.${vehicle}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
