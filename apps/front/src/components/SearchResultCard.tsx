import { ArrowRight, CalendarRange, Navigation } from 'lucide-react';
import type { CSSProperties } from 'react';
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
import { BayThumbnail } from './art/BayThumbnail';
import { VehicleBadges } from './VehicleBadges';

interface SearchResultCardProps {
  listing: Listing;
  distanceKm: number | null;
  precision: LocationPrecision | null;
  tier: RentalTier | null;
  vehicle: VehicleType | null;
  focused: boolean;
  onFocus: () => void;
  /** Rang d'apparition : les cartes montent l'une après l'autre, pas en bloc. */
  revealOrder?: number;
}

export const SearchResultCard = ({
  listing,
  distanceKm,
  precision,
  tier,
  vehicle,
  focused,
  onFocus,
  revealOrder = 0,
}: SearchResultCardProps) => {
  const { t } = useTranslation(['listing', 'common']);

  const tierPrice = tier === null ? null : priceForTier(listing.pricing, tier);
  const nightly = cheapestNightlyRateInCents(listing.pricing);

  return (
    <li className="animate-rise" style={{ '--i': Math.min(revealOrder, 8) } as CSSProperties}>
      {/*
       * L'article entier réagit au survol et au clic pour désigner le marqueur,
       * mais le lien reste le seul élément focalisable : un conducteur au
       * clavier tabule d'une annonce à l'autre, pas d'un conteneur à un lien.
       */}
      <article
        onMouseEnter={onFocus}
        onClick={onFocus}
        className={cn(
          'group flex gap-3 rounded-2xl border bg-bg-raised p-3 sm:gap-4 transition-[border-color,box-shadow,translate] duration-200 ease-[var(--ease-signal)]',
          focused
            ? 'border-brand shadow-[var(--shadow-lift)] ring-4 ring-brand/15'
            : 'border-line hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-lift)]',
        )}
      >
        <BayThumbnail
          box={listing.box}
          className="aspect-[4/5] w-20 shrink-0 self-start sm:aspect-auto sm:min-h-32 sm:w-28 sm:self-stretch"
        />

        <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
          {(distanceKm !== null || precision === 'approximate') && (
            <p className="tabular flex flex-wrap items-center gap-1.5 text-xs font-medium">
              {distanceKm !== null && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors',
                    focused ? 'bg-brand text-on-brand' : 'bg-accent-soft text-accent',
                  )}
                >
                  <Navigation className="size-3" aria-hidden="true" />
                  {t('listing:mapSearch.distance', { distance: formatDistance(distanceKm) })}
                </span>
              )}
              {precision === 'approximate' && (
                <span className="rounded-full bg-warn-bg px-2 py-0.5 text-warn">
                  {t('listing:map.approx')}
                </span>
              )}
            </p>
          )}

          <p className="mt-2 font-display text-[1.05rem] leading-snug font-semibold text-fg">
            {listing.address}
          </p>

          <p className="tabular mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
            <span className="font-mono font-medium text-fg-muted">
              {t('listing:card.box', { box: listing.box })}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="size-3.5 shrink-0" aria-hidden="true" />
              {t('listing:card.availableUntil', { date: formatDay(listing.availability.to) })}
            </span>
          </p>

          <VehicleBadges
            acceptedVehicles={listing.acceptedVehicles}
            highlighted={vehicle}
            className="mt-3"
          />

          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-4">
            <p className="tabular flex items-baseline gap-1.5">
              {tier !== null ? (
                tierPrice === null ? (
                  <span className="text-sm text-fg-subtle">{t('listing:card.noPrice')}</span>
                ) : (
                  <>
                    <span className="font-display text-2xl font-bold tracking-tight text-fg">
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
                  <span className="font-display text-2xl font-bold tracking-tight text-fg">
                    {formatCents(nightly)}
                  </span>
                  <span className="text-xs text-fg-subtle">{t('common:unit.perNight')}</span>
                </>
              )}
            </p>

            <Link
              to={`/place/${listing.id}`}
              className="group/link -mr-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
            >
              {t('listing:map.openListing')}
              <ArrowRight
                className="size-4 transition-transform group-hover/link:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
};
