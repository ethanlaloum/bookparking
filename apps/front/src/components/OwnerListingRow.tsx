import { ArrowRight, PencilLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { OwnerListing } from '../app/listing/domain/ports/ListingGateway';
import { cheapestNightlyRateInCents } from '../app/listing/domain/entities/Listing';
import { formatCents, formatDay } from '../lib/format';
import { ListingThumbnail } from './ListingThumbnail';
import { Badge } from './ui/badge';
import { buttonVariants } from './ui/buttonVariants';

export const OwnerListingRow = ({ listing }: { listing: OwnerListing }) => {
  const { t } = useTranslation(['account', 'common']);
  const rate = cheapestNightlyRateInCents(listing.pricing);
  const isActive = listing.status === 'ACTIVE';

  return (
    <li className="flex flex-col gap-4 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-bg-sunken/40 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <ListingThumbnail photos={listing.photos} box={listing.box} className="h-16 w-13 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <p className="font-medium text-fg">
            {listing.address} · <span className="font-mono text-[0.9em]">{listing.box}</span>
          </p>
          <p className="tabular mt-1 text-xs text-fg-subtle">
            {formatDay(listing.availability.from)} → {formatDay(listing.availability.to)}
          </p>
        </div>
      </div>

      <p className="tabular font-display text-xl font-bold tracking-tight text-fg sm:w-28 sm:text-right">
        {rate === null ? '—' : formatCents(rate)}
      </p>

      <Badge tone={isActive ? 'ok' : 'neutral'} className="shrink-0 self-start sm:w-28 sm:justify-center sm:self-auto">
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {isActive ? t('account:places.active') : t('account:places.unpublished')}
      </Badge>

      <div className="flex shrink-0 gap-2">
        {isActive && (
          <Link
            to={`/place/${listing.id}/modifier`}
            aria-label={t('account:places.editLabel', { address: listing.address, box: listing.box })}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            <PencilLine className="size-4" aria-hidden="true" />
            {t('account:places.edit')}
          </Link>
        )}
        <Link to={`/place/${listing.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          {t('account:places.open')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
};
