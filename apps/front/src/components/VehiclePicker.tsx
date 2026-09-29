import { useTranslation } from 'react-i18next';

import {
  VEHICLE_TYPES,
  type VehicleType,
} from '../app/listing/domain/entities/SearchCriteria';
import { cn } from '../lib/cn';
import { VEHICLE_ICON } from './VehicleIcon';

interface VehiclePickerProps {
  selected: readonly VehicleType[];
  onToggle: (vehicle: VehicleType) => void;
  error?: string;
}

/**
 * Des cases à cocher, pas des boutons : plusieurs véhicules peuvent être
 * acceptés, et c'est exactement ce qu'un groupe de cases dit à un lecteur
 * d'écran. L'entrée reste focalisable et porte l'état ; l'étiquette qui
 * l'entoure la rend cliquable sur toute sa surface.
 */
export const VehiclePicker = ({ selected, onToggle, error }: VehiclePickerProps) => {
  const { t } = useTranslation('listing');

  return (
    <fieldset>
      <legend className="text-sm font-medium text-fg">{t('criteria.accepted')}</legend>
      <p className="mt-1 text-xs text-fg-subtle">{t('criteria.acceptedHint')}</p>

      <div className="mt-3 flex flex-wrap gap-2.5">
        {VEHICLE_TYPES.map((vehicle) => {
          const Icon = VEHICLE_ICON[vehicle];
          const checked = selected.includes(vehicle);
          return (
            <label
              key={vehicle}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-[2px] border px-3.5 py-2.5 text-sm transition-colors duration-150',
                checked
                  ? 'border-accent bg-accent/10 text-fg'
                  : 'border-line-strong bg-bg-raised text-fg-muted hover:border-line-strong hover:text-fg',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(vehicle)}
                className="size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
              />
              <Icon
                className={cn('size-4 shrink-0', checked ? 'text-accent' : 'text-fg-subtle')}
                aria-hidden="true"
              />
              {t(`criteria.vehicleType.${vehicle}`)}
            </label>
          );
        })}
      </div>

      {error !== undefined && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </fieldset>
  );
};
