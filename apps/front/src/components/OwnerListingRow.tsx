import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { OwnerListing } from '../app/listing/domain/ports/ListingGateway';
import { cheapestNightlyRateInCents } from '../app/listing/domain/entities/Listing';
import { formatCents, formatDay } from '../lib/format';
import { Badge } from './ui/badge';
import { buttonVariants } from './ui/buttonVariants';

export const OwnerListingRow = ({ listing }: { listing: OwnerListing }) => {
  const { t } = useTranslation(['account', 'common']);
  const rate = cheapestNightlyRateInCents(listing.pricing);
  const isActive = listing.status === 'ACTIVE';

  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1">
        <p className="flex items-start gap-1.5 font-medium text-fg">
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0">
            {listing.address} · {listing.box}
          </span>
        </p>
        <p className="tabular mt-1 pl-5.5 text-xs text-fg-subtle">
          {formatDay(listing.availability.from)} → {formatDay(listing.availability.to)}
        </p>
      </div>

      <p className="tabular font-display text-lg font-semibold text-fg sm:w-28 sm:text-right">
        {rate === null ? '—' : `${formatCents(rate)}`}
      </p>

      <Badge tone={isActive ? 'ok' : 'neutral'} className="shrink-0 sm:w-28 sm:justify-center">
        {isActive ? t('account:places.active') : t('account:places.unpublished')}
      </Badge>

      <Link
        to={`/place/${listing.id}`}
        className={`${buttonVariants({ variant: 'outline', size: 'sm' })} shrink-0`}
      >
        {t('account:places.open')}
      </Link>
    </li>
  );
};
