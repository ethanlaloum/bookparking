import { useTranslation } from 'react-i18next';

import {
  VEHICLE_TYPES,
  type VehicleType,
} from '../app/listing/domain/entities/SearchCriteria';
import { cn } from '../lib/cn';
import { VEHICLE_ICON } from './VehicleIcon';

const isVehicleType = (value: string): value is VehicleType =>
  (VEHICLE_TYPES as readonly string[]).includes(value);

/**
 * Le silence se dit, il ne se cache pas : une annonce qui n'a rien déclaré
 * affiche « non précisé » plutôt que rien du tout, sans quoi un conducteur
 * croirait qu'elle n'accepte aucun véhicule.
 */
export const VehicleBadges = ({
  acceptedVehicles,
  highlighted,
  className,
}: {
  acceptedVehicles: readonly string[];
  highlighted?: VehicleType | null;
  className?: string;
}) => {
  const { t } = useTranslation('listing');
  const known = acceptedVehicles.filter(isVehicleType);

  if (known.length === 0)
    return <p className={cn('text-xs text-fg-subtle italic', className)}>{t('criteria.notDeclared')}</p>;

  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {known.map((vehicle) => {
        const Icon = VEHICLE_ICON[vehicle];
        const marked = highlighted === vehicle;
        return (
          <li
            key={vehicle}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-none transition-colors',
              marked
                ? 'border-brand bg-brand text-on-brand'
                : 'border-line bg-bg-sunken text-fg-muted',
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            {t(`criteria.vehicleType.${vehicle}`)}
          </li>
        );
      })}
    </ul>
  );
};
