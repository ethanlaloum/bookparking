import { CalendarRange, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  cheapestNightlyRateInCents,
  type Listing,
} from '../app/listing/domain/entities/Listing';
import { formatCents, formatDay } from '../lib/format';
import { Badge } from './ui/badge';

export const ListingCard = ({ listing, index }: { listing: Listing; index: number }) => {
  const { t } = useTranslation(['listing', 'common']);
  const rate = cheapestNightlyRateInCents(listing.pricing);

  return (
    <li className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
      <Link
        to={`/place/${listing.id}`}
        className="group flex h-full flex-col rounded-[2px] border border-line bg-bg-raised shadow-[var(--shadow-panel)] transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-signal)] hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-lift)]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-line bg-bg-sunken">
          <div className="bg-hatch absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
            <Badge tone="accent" className="font-display">
              {t('listing:card.box', { box: listing.box })}
            </Badge>
            <span className="tabular rounded-[2px] bg-bg-raised/92 px-2 py-1 text-xs font-medium text-fg-muted">
              {t('listing:card.photoCount', { count: listing.photos.length })}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="flex items-start gap-1.5 font-display text-base leading-snug font-semibold text-fg">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <span className="min-w-0">{listing.address}</span>
          </p>

          <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <CalendarRange className="size-3.5 shrink-0" aria-hidden="true" />
            {t('listing:card.availableUntil', { date: formatDay(listing.availability.to) })}
          </p>

          <div className="mt-auto flex items-baseline gap-1.5 border-t border-line pt-3">
            {rate === null ? (
              <span className="text-sm text-fg-muted">{t('listing:card.noPrice')}</span>
            ) : (
              <>
                <span className="text-xs text-fg-subtle">{t('listing:card.from')}</span>
                <span className="tabular font-display text-xl font-semibold text-fg">
                  {formatCents(rate)}
                </span>
                <span className="text-xs text-fg-subtle">{t('common:unit.perNight')}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
};
