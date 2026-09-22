import { EyeOff } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { hasNoPrice, isActive } from '../../app/back-office/domain/entities/AdminListing';
import type { AdminListing } from '../../app/back-office/domain/entities/AdminListing';
import { listListingsRequested } from '../../app/back-office/domain/use-cases/list-listings/listListingsEpic';
import { EmptyState } from '../../components/EmptyState';
import { ModerationDialog } from '../../components/ModerationDialog';
import { Notice } from '../../components/Notice';
import { Td, TableShell, Th } from '../../components/TableShell';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useModeration } from '../../hooks/useModeration';
import { formatCents, formatDay } from '../../lib/format';
import {
  selectActiveListingCount,
  selectListingsError,
  selectListingsLoading,
  selectSortedListings,
} from '../../selectors/back-office/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../../store/redux';

const Pricing = ({ listing }: { listing: AdminListing }) => {
  const { t } = useTranslation('admin');

  if (hasNoPrice(listing)) return <Badge tone="warn">{t('listings.noPrice')}</Badge>;

  const tiers = [
    listing.pricing.dayInCents === null
      ? null
      : t('listings.pricing.day', { price: formatCents(listing.pricing.dayInCents) }),
    listing.pricing.weekInCents === null
      ? null
      : t('listings.pricing.week', { price: formatCents(listing.pricing.weekInCents) }),
    listing.pricing.monthInCents === null
      ? null
      : t('listings.pricing.month', { price: formatCents(listing.pricing.monthInCents) }),
  ].filter((tier): tier is string => tier !== null);

  return (
    <span className="tabular text-xs text-fg-muted">
      {tiers.length === 0 ? '—' : tiers.join(' · ')}
    </span>
  );
};

export const AdminListingsPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const moderation = useModeration();

  const listings = useAppSelector(selectSortedListings);
  const active = useAppSelector(selectActiveListingCount);
  const loading = useAppSelector(selectListingsLoading);
  const error = useAppSelector(selectListingsError);

  useEffect(() => {
    dispatch(listListingsRequested());
  }, [dispatch]);

  return (
    <div>
      <p className="tabular text-sm text-fg-subtle">
        {t('admin:listings.subtitle', { total: listings.length, active })}
      </p>

      {error !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-4">
          {error}
        </Notice>
      )}

      <div className="mt-4">
        {loading && listings.length === 0 && <Skeleton className="h-64" />}
        {!loading && listings.length === 0 && <EmptyState title={t('admin:listings.empty')} />}

        {listings.length > 0 && (
          <TableShell
            caption={t('admin:listings.caption')}
            head={
              <>
                <Th>{t('admin:listings.column.place')}</Th>
                <Th>{t('admin:listings.column.owner')}</Th>
                <Th>{t('admin:listings.column.vehicles')}</Th>
                <Th>{t('admin:listings.column.pricing')}</Th>
                <Th>{t('admin:listings.column.publishedAt')}</Th>
                <Th>{t('admin:listings.column.status')}</Th>
                <Th className="text-right">{t('admin:listings.column.action')}</Th>
              </>
            }
          >
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-line last:border-b-0">
                <Td>
                  <span className="font-medium text-fg">{listing.address}</span>
                  <span className="block text-xs text-fg-subtle">
                    {t('admin:listings.box', { box: listing.box })}
                  </span>
                </Td>
                <Td className="text-fg-muted">{listing.ownerEmail}</Td>
                <Td className="text-xs text-fg-muted">{listing.acceptedVehicles.join(', ')}</Td>
                <Td>
                  <Pricing listing={listing} />
                </Td>
                <Td className="tabular whitespace-nowrap text-fg-muted">
                  {formatDay(listing.publishedAt)}
                </Td>
                <Td>
                  <Badge tone={isActive(listing) ? 'ok' : 'neutral'}>
                    {t(`admin:listings.status.${listing.status}`)}
                  </Badge>
                </Td>
                <Td className="text-right">
                  {/* Seule une annonce active se dépublie : l'api filtre sur
                      `status = 'ACTIVE'` et répondrait 404 sur les autres. */}
                  {isActive(listing) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        moderation.ask({
                          kind: 'unpublish',
                          targetId: listing.id,
                          label: `${listing.address} · ${listing.box}`,
                        })
                      }
                    >
                      <EyeOff className="size-4" aria-hidden="true" />
                      {t('admin:listings.unpublish')}
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </TableShell>
        )}
      </div>

      <ModerationDialog
        target={moderation.target}
        pending={moderation.pending}
        error={moderation.error}
        onConfirm={moderation.confirm}
        onClose={moderation.close}
      />
    </div>
  );
};
