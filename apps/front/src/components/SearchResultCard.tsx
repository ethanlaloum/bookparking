import { CalendarRange, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  formatDistance,
  type LocationPrecision,
} from '../app/listing/domain/entities/Coordinates';
import { cheapestNightlyRateInCents, type Listing } from '../app/listing/domain/entities/Listing';
import {
  priceForTier,
  type RentalTier,
  type VehicleType,
} from '../app/listing/domain/entities/SearchCriteria';
import { cn } from '../lib/cn';
import { formatCents, formatDay } from '../lib/format';
import { Badge } from './ui/badge';
import { VehicleBadges } from './VehicleBadges';

interface SearchResultCardProps {
  listing: Listing;
  distanceKm: number | null;
  precision: LocationPrecision | null;
  tier: RentalTier | null;
  vehicle: VehicleType | null;
  focused: boolean;
  onFocus: () => void;
}

export const SearchResultCard = ({
  listing,
  distanceKm,
  precision,
  tier,
  vehicle,
  focused,
  onFocus,
}: SearchResultCardProps) => {
  const { t } = useTranslation(['listing', 'common']);

  const tierPrice = tier === null ? null : priceForTier(listing.pricing, tier);
  const nightly = cheapestNightlyRateInCents(listing.pricing);

  return (
    <li>
      {/*
       * L'article entier réagit au survol et au clic pour désigner le marqueur,
       * mais le lien reste le seul élément focalisable : un conducteur au
       * clavier tabule d'une annonce à l'autre, pas d'un conteneur à un lien.
       */}
      <article
        onMouseEnter={onFocus}
        onClick={onFocus}
        className={cn(
          'rounded-[2px] border bg-bg-raised p-4 transition-[border-color,box-shadow] duration-200',
          focused
            ? 'border-accent shadow-[var(--shadow-lift)]'
            : 'border-line hover:border-line-strong',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex min-w-0 items-start gap-1.5 font-display text-[0.95rem] leading-snug font-semibold text-fg">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <span className="min-w-0">{listing.address}</span>
          </p>
          <Badge tone="accent" className="shrink-0 font-display">
            {t('listing:card.box', { box: listing.box })}
          </Badge>
        </div>

        <p className="tabular mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5.5 text-xs text-fg-subtle">
          {distanceKm !== null && (
            <span className={focused ? 'text-accent' : undefined}>
              {t('listing:mapSearch.distance', { distance: formatDistance(distanceKm) })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarRange className="size-3.5 shrink-0" aria-hidden="true" />
            {t('listing:card.availableUntil', { date: formatDay(listing.availability.to) })}
          </span>
          {precision === 'approximate' && (
            <span className="text-warn">{t('listing:map.approx')}</span>
          )}
        </p>

        <VehicleBadges
          acceptedVehicles={listing.acceptedVehicles}
          highlighted={vehicle}
          className="mt-3 pl-5.5"
        />

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
          <p className="tabular flex items-baseline gap-1.5">
            {tier !== null ? (
              tierPrice === null ? (
                <span className="text-sm text-fg-subtle">{t('listing:card.noPrice')}</span>
              ) : (
                <>
                  <span className="font-display text-xl font-semibold text-fg">
                    {formatCents(tierPrice)}
                  </span>
                  <span className="text-xs text-fg-subtle">
                    {t(`listing:criteria.tier.${tier}`).toLocaleLowerCase('fr-FR')}
                  </span>
                </>
              )
            ) : nightly === null ? (
              <span className="text-sm text-fg-subtle">{t('listing:card.noPrice')}</span>
            ) : (
              <>
                <span className="text-xs text-fg-subtle">{t('listing:card.from')}</span>
                <span className="font-display text-xl font-semibold text-fg">
                  {formatCents(nightly)}
                </span>
                <span className="text-xs text-fg-subtle">{t('common:unit.perNight')}</span>
              </>
            )}
          </p>

          <Link
            to={`/place/${listing.id}`}
            className="rounded-[2px] text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('listing:map.openListing')}
          </Link>
        </div>
      </article>
    </li>
  );
};
