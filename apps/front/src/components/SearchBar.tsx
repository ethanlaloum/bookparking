import { Search } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  RENTAL_TIERS,
  VEHICLE_TYPES,
  type RentalTier,
  type SearchCriteria,
  type SearchedAddress,
  type VehicleType,
} from '../app/listing/domain/entities/SearchCriteria';
import { AddressSearch } from './AddressSearch';
import { Button } from './ui/button';

interface SearchBarProps {
  initial: SearchCriteria;
  submitLabel: string;
  onSubmit: (criteria: SearchCriteria) => void;
}

const fieldClass = 'flex min-w-0 flex-col gap-1.5';
const labelClass = 'text-sm font-medium text-fg';
const selectClass =
  'min-h-11 w-full cursor-pointer rounded-[2px] border border-line-strong bg-bg-raised px-3 text-fg transition-colors duration-150 focus:border-accent';

export const SearchBar = ({ initial, submitLabel, onSubmit }: SearchBarProps) => {
  const { t } = useTranslation('listing');
  const vehicleId = useId();
  const tierId = useId();
  const hintId = useId();

  const [address, setAddress] = useState<SearchedAddress | null>(initial.address);
  const [vehicle, setVehicle] = useState<VehicleType | null>(initial.vehicle);
  const [tier, setTier] = useState<RentalTier | null>(initial.tier);
  const [tooShort, setTooShort] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ address, vehicle, tier });
      }}
    >
      {/*
       * Chaque colonne a la même structure — un libellé, un contrôle de 44 px —
       * donc la rangée s'aligne d'elle-même, sans `items-end` ni marge calibrée
       * à la main. Le bouton partage cette hauteur : sa prééminence vient de sa
       * couleur, pas de sa taille.
       */}
      <div className="grid gap-x-4 gap-y-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <AddressSearch
          value={address}
          onChoose={setAddress}
          onQueryStateChange={(state) => setTooShort(state.tooShort)}
        />

        <div className={fieldClass}>
          <label htmlFor={vehicleId} className={labelClass}>
            {t('criteria.vehicle')}
          </label>
          <select
            id={vehicleId}
            className={selectClass}
            value={vehicle ?? ''}
            onChange={(event) =>
              setVehicle(event.target.value === '' ? null : (event.target.value as VehicleType))
            }
          >
            <option value="">{t('criteria.anyVehicle')}</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`criteria.vehicleType.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor={tierId} className={labelClass}>
            {t('criteria.duration')}
          </label>
          <select
            id={tierId}
            className={selectClass}
            value={tier ?? ''}
            onChange={(event) =>
              setTier(event.target.value === '' ? null : (event.target.value as RentalTier))
            }
          >
            <option value="">{t('criteria.anyDuration')}</option>
            {RENTAL_TIERS.map((value) => (
              <option key={value} value={value}>
                {t(`criteria.tier.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          {/* Une étiquette vide tient la place du libellé des autres colonnes :
              c'est elle qui fait tomber le bouton sur la même ligne que les
              contrôles, sans décalage codé en dur. */}
          <span aria-hidden="true" className={`${labelClass} hidden lg:block`}>
            &nbsp;
          </span>
          <Button type="submit" className="w-full lg:w-auto lg:px-7">
            <Search className="size-4" aria-hidden="true" />
            {submitLabel}
          </Button>
        </div>
      </div>

      <p id={hintId} className="mt-2.5 text-xs text-fg-subtle">
        {address !== null && !tooShort ? address.label : t('mapSearch.hint')}
      </p>
    </form>
  );
};
