import {
  CalendarDays,
  CalendarRange,
  Infinity as AnyDuration,
  Search,
  Shapes,
  Sun,
  type LucideIcon,
} from 'lucide-react';
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
import { cn } from '../lib/cn';
import { AddressSearch } from './AddressSearch';
import { CONTROL, DIVIDER, LABEL, SEGMENT } from './searchFieldStyles';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { VEHICLE_ICON } from './VehicleIcon';

interface SearchBarProps {
  initial: SearchCriteria;
  submitLabel: string;
  onSubmit: (criteria: SearchCriteria) => void;
  className?: string;
}

const selectClass = cn(CONTROL, 'px-3.5 lg:px-0');

// Sur la barre segmentée, la liste s'aligne sur le bord du segment, pas sur
// celui du texte : elle déborde du padding de part et d'autre.
const LIST = 'lg:-left-4 lg:min-w-[calc(100%+2rem)]';

const TIER_ICON: Record<RentalTier, LucideIcon> = {
  day: Sun,
  week: CalendarRange,
  month: CalendarDays,
};

export const SearchBar = ({ initial, submitLabel, onSubmit, className }: SearchBarProps) => {
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
      className={cn(
        'rounded-3xl border border-line bg-bg-raised p-4 text-fg shadow-[var(--shadow-float)] lg:rounded-2xl lg:p-1.5',
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ address, vehicle, tier });
      }}
    >
      {/*
       * Chaque colonne a la même structure — un libellé, un contrôle — donc la
       * rangée s'aligne d'elle-même. La colonne du bouton n'a pas de libellé :
       * `items-stretch` lui donne la hauteur des trois autres, et le bouton la
       * remplit. Aucune marge n'est calibrée à la main.
       */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-stretch lg:gap-0">
        <AddressSearch
          value={address}
          onChoose={setAddress}
          onQueryStateChange={(state) => setTooShort(state.tooShort)}
        />

        <div className={cn(SEGMENT, DIVIDER)}>
          <label id={`${vehicleId}-label`} htmlFor={vehicleId} className={LABEL}>
            {t('criteria.vehicle')}
          </label>
          <Select
            id={vehicleId}
            labelId={`${vehicleId}-label`}
            value={vehicle ?? ''}
            onChange={(next) => setVehicle(next === '' ? null : next)}
            options={[
              { value: '', label: t('criteria.anyVehicle'), icon: Shapes },
              ...VEHICLE_TYPES.map((type) => ({
                value: type,
                label: t(`criteria.vehicleType.${type}`),
                icon: VEHICLE_ICON[type],
              })),
            ]}
            className={selectClass}
            listClassName={LIST}
          />
        </div>

        <div className={cn(SEGMENT, DIVIDER)}>
          <label id={`${tierId}-label`} htmlFor={tierId} className={LABEL}>
            {t('criteria.duration')}
          </label>
          <Select
            id={tierId}
            labelId={`${tierId}-label`}
            value={tier ?? ''}
            onChange={(next) => setTier(next === '' ? null : next)}
            options={[
              { value: '', label: t('criteria.anyDuration'), icon: AnyDuration },
              ...RENTAL_TIERS.map((value) => ({
                value,
                label: t(`criteria.tier.${value}`),
                icon: TIER_ICON[value],
              })),
            ]}
            className={selectClass}
            listClassName={LIST}
          />
        </div>

        <div className="flex pt-1 lg:pt-0 lg:pl-1.5">
          <Button type="submit" size="lg" className="w-full lg:h-full lg:w-auto lg:px-8">
            <Search className="size-[1.1rem]" aria-hidden="true" />
            {submitLabel}
          </Button>
        </div>
      </div>

      <p id={hintId} className="mt-3 px-1 text-xs text-fg-subtle lg:mt-1.5 lg:mb-1 lg:px-4">
        {address !== null && !tooShort ? address.label : t('mapSearch.hint')}
      </p>
    </form>
  );
};
