import { Ban } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  hasWaitedOverADay,
  isCancellable,
  type AdminRentalRequestStatus,
} from '../../app/back-office/domain/entities/AdminRentalRequest';
import { listRentalRequestsRequested } from '../../app/back-office/domain/use-cases/list-rental-requests/listRentalRequestsEpic';
import { EmptyState } from '../../components/EmptyState';
import { ModerationDialog } from '../../components/ModerationDialog';
import { Notice } from '../../components/Notice';
import { Td, TableShell, Th } from '../../components/TableShell';
import { Badge } from '../../components/ui/badge';
import type { BadgeVariantProps } from '../../components/ui/badgeVariants';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useModeration } from '../../hooks/useModeration';
import { formatCents, formatDay, formatMoment } from '../../lib/format';
import {
  selectRentalRequestsError,
  selectRentalRequestsLoading,
  selectSortedRentalRequests,
} from '../../selectors/back-office/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../../store/redux';

const TONE_BY_STATUS: Record<AdminRentalRequestStatus, BadgeVariantProps['tone']> = {
  PENDING: 'warn',
  CONFIRMED: 'ok',
  EXPIRED: 'neutral',
  CANCELLED: 'danger',
};

export const AdminRequestsPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const moderation = useModeration();

  const requests = useAppSelector(selectSortedRentalRequests);
  const loading = useAppSelector(selectRentalRequestsLoading);
  const error = useAppSelector(selectRentalRequestsError);

  useEffect(() => {
    dispatch(listRentalRequestsRequested());
  }, [dispatch]);

  // Figé pour le rendu : sans cela, chaque ligne lirait une horloge
  // légèrement différente, et deux demandes nées à la même seconde pourraient
  // ne pas porter le même verdict.
  const now = useMemo(() => new Date(), []);
  const waiting = requests.filter((request) => hasWaitedOverADay(request, now)).length;

  return (
    <div>
      <p className="tabular text-sm text-fg-subtle">
        {t('admin:requests.subtitle', { total: requests.length, waiting })}
      </p>

      {error !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-4">
          {error}
        </Notice>
      )}

      <div className="mt-4">
        {loading && requests.length === 0 && <Skeleton className="h-64" />}
        {!loading && requests.length === 0 && <EmptyState title={t('admin:requests.empty')} />}

        {requests.length > 0 && (
          <TableShell
            caption={t('admin:requests.caption')}
            head={
              <>
                <Th>{t('admin:requests.column.place')}</Th>
                <Th>{t('admin:requests.column.owner')}</Th>
                <Th>{t('admin:requests.column.renter')}</Th>
                <Th>{t('admin:requests.column.dates')}</Th>
                <Th className="text-right">{t('admin:requests.column.price')}</Th>
                <Th>{t('admin:requests.column.requestedAt')}</Th>
                <Th>{t('admin:requests.column.status')}</Th>
                <Th className="text-right">{t('admin:requests.column.action')}</Th>
              </>
            }
          >
            {requests.map((request) => (
              <tr key={request.id} className="border-b border-line last:border-b-0">
                <Td>
                  <span className="font-medium text-fg">{request.address}</span>
                  <span className="block text-xs text-fg-subtle">{request.box}</span>
                </Td>
                <Td className="text-fg-muted">{request.ownerEmail}</Td>
                <Td className="text-fg-muted">{request.renterEmail}</Td>
                <Td className="tabular whitespace-nowrap text-fg-muted">
                  {t('admin:requests.range', {
                    from: formatDay(request.fromDay),
                    to: formatDay(request.toDay),
                  })}
                </Td>
                <Td className="tabular text-right text-fg">{formatCents(request.priceInCents)}</Td>
                <Td className="tabular whitespace-nowrap text-fg-muted">
                  {formatMoment(request.requestedAt)}
                </Td>
                <Td>
                  <Badge tone={TONE_BY_STATUS[request.status]}>
                    {t(`admin:requests.status.${request.status}`)}
                  </Badge>
                  {hasWaitedOverADay(request, now) && (
                    <Badge tone="danger" className="ml-2">
                      {t('admin:requests.waiting')}
                    </Badge>
                  )}
                </Td>
                <Td className="text-right">
                  {/* L'api n'annule que `PENDING` et `CONFIRMED` : offrir le
                      bouton ailleurs promettrait une action refusée en 404. */}
                  {isCancellable(request) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        moderation.ask({
                          kind: 'cancelRequest',
                          targetId: request.id,
                          label: `${request.address} · ${request.renterEmail}`,
                        })
                      }
                    >
                      <Ban className="size-4" aria-hidden="true" />
                      {t('admin:requests.cancel')}
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
