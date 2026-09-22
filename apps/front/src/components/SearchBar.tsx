import { Search } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SearchedAddress } from '../app/listing/domain/entities/SearchCriteria';
import {
  RENTAL_TIERS,
  VEHICLE_TYPES,
  type RentalTier,
  type SearchCriteria,
  type VehicleType,
} from '../app/listing/domain/entities/SearchCriteria';
import { AddressSearch } from './AddressSearch';
import { Button } from './ui/button';

interface SearchBarProps {
  initial: SearchCriteria;
  submitLabel: string;
  onSubmit: (criteria: SearchCriteria) => void;
}

const selectClass =
  'min-h-11 w-full cursor-pointer rounded-[2px] border border-line-strong bg-bg-raised px-3 text-fg transition-colors duration-150 focus:border-accent';

export const SearchBar = ({ initial, submitLabel, onSubmit }: SearchBarProps) => {
  const { t } = useTranslation('listing');
  const vehicleId = useId();
  const tierId = useId();

  const [address, setAddress] = useState<SearchedAddress | null>(initial.address);
  const [vehicle, setVehicle] = useState<VehicleType | null>(initial.vehicle);
  const [tier, setTier] = useState<RentalTier | null>(initial.tier);

  return (
    <form
      className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ address, vehicle, tier });
      }}
    >
      <AddressSearch value={address} onChoose={setAddress} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={vehicleId} className="text-sm font-medium text-fg">
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor={tierId} className="text-sm font-medium text-fg">
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

      <Button type="submit" size="lg" className="lg:mb-[1.625rem]">
        <Search className="size-4" aria-hidden="true" />
        {submitLabel}
      </Button>
    </form>
  );
};
