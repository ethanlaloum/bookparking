import {
  Ban,
  CalendarCheck2,
  CalendarClock,
  Clock3,
  Euro,
  EyeOff,
  Hourglass,
  SquareParking,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { isAccelerating } from '../../app/back-office/domain/entities/Overview';
import { readOverviewRequested } from '../../app/back-office/domain/use-cases/read-overview/readOverviewEpic';
import { MetricTile } from '../../components/MetricTile';
import { Notice } from '../../components/Notice';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCents, formatCount } from '../../lib/format';
import {
  selectNeedsAttention,
  selectOverview,
  selectOverviewError,
  selectOverviewLoading,
} from '../../selectors/back-office/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../../store/redux';

interface ActivityTileProps {
  icon: LucideIcon;
  label: string;
  last24h: number;
  last7d: number;
  windowLabel: string;
  acceleratingLabel: string;
}

const ActivityTile = ({
  icon: Icon,
  label,
  last24h,
  last7d,
  windowLabel,
  acceleratingLabel,
}: ActivityTileProps) => (
  <Card role="group" aria-label={label} className="flex flex-col gap-2 p-5">
    <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">
      <Icon className="size-4 text-fg-subtle" aria-hidden="true" />
      {label}
    </p>
    <p className="tabular font-display text-3xl leading-none font-bold text-fg">
      {formatCount(last24h)}
    </p>
    <p className="tabular text-xs text-fg-subtle">{windowLabel}</p>
    {isAccelerating(last24h, last7d) && (
      <Badge tone="accent" className="self-start">
        <TrendingUp className="size-3" aria-hidden="true" />
        {acceleratingLabel}
      </Badge>
    )}
  </Card>
);

const Block = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) => (
  <section className="mt-8 first:mt-0">
    <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
    <p className="mt-1 text-sm text-fg-subtle">{hint}</p>
    <div className="mt-4">{children}</div>
  </section>
);

export const AdminOverviewPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();

  const overview = useAppSelector(selectOverview);
  const loading = useAppSelector(selectOverviewLoading);
  const error = useAppSelector(selectOverviewError);
  const alerted = useAppSelector(selectNeedsAttention);

  useEffect(() => {
    dispatch(readOverviewRequested());
  }, [dispatch]);

  return (
    <div>
      {error !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mb-6">
          {error}
        </Notice>
      )}

      {overview === null && loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((slot) => (
            <Skeleton key={slot} className="h-32" />
          ))}
        </div>
      )}

      {overview !== null && (
        <>
          <Block title={t('admin:counts.title')} hint={t('admin:counts.hint')}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                tone="accent"
                icon={Euro}
                label={t('admin:metric.revenue')}
                value={formatCents(overview.counts.confirmedRevenueInCents)}
                hint={t('admin:metric.revenueHint')}
              />
              <MetricTile
                icon={Users}
                label={t('admin:metric.accounts')}
                value={formatCount(overview.counts.accounts)}
                hint={t('admin:metric.accountsHint')}
              />
              <MetricTile
                icon={UserMinus}
                label={t('admin:metric.suspended')}
                value={formatCount(overview.counts.suspendedAccounts)}
                hint={t('admin:metric.suspendedHint')}
              />
              <MetricTile
                icon={SquareParking}
                label={t('admin:metric.activeListings')}
                value={formatCount(overview.counts.activeListings)}
                hint={t('admin:metric.activeListingsHint')}
              />
              <MetricTile
                icon={EyeOff}
                label={t('admin:metric.unpublishedListings')}
                value={formatCount(overview.counts.unpublishedListings)}
                hint={t('admin:metric.unpublishedListingsHint')}
              />
              <MetricTile
                icon={Clock3}
                label={t('admin:metric.pendingRequests')}
                value={formatCount(overview.counts.pendingRequests)}
                hint={t('admin:metric.pendingRequestsHint')}
              />
              <MetricTile
                icon={CalendarCheck2}
                label={t('admin:metric.confirmedRequests')}
                value={formatCount(overview.counts.confirmedRequests)}
                hint={t('admin:metric.confirmedRequestsHint')}
              />
              <MetricTile
                icon={Ban}
                label={t('admin:metric.cancelledRequests')}
                value={formatCount(overview.counts.cancelledRequests)}
                hint={t('admin:metric.cancelledRequestsHint')}
              />
            </div>
          </Block>

          <Block title={t('admin:activity.title')} hint={t('admin:activity.hint')}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ActivityTile
                icon={UserPlus}
                label={t('admin:metric.newAccounts')}
                last24h={overview.activity.accountsLast24h}
                last7d={overview.activity.accountsLast7d}
                windowLabel={t('admin:activity.window', {
                  day: formatCount(overview.activity.accountsLast24h),
                  week: formatCount(overview.activity.accountsLast7d),
                })}
                acceleratingLabel={t('admin:activity.accelerating')}
              />
              <ActivityTile
                icon={SquareParking}
                label={t('admin:metric.newListings')}
                last24h={overview.activity.listingsLast24h}
                last7d={overview.activity.listingsLast7d}
                windowLabel={t('admin:activity.window', {
                  day: formatCount(overview.activity.listingsLast24h),
                  week: formatCount(overview.activity.listingsLast7d),
                })}
                acceleratingLabel={t('admin:activity.accelerating')}
              />
              <ActivityTile
                icon={CalendarClock}
                label={t('admin:metric.newRequests')}
                last24h={overview.activity.requestsLast24h}
                last7d={overview.activity.requestsLast7d}
                windowLabel={t('admin:activity.window', {
                  day: formatCount(overview.activity.requestsLast24h),
                  week: formatCount(overview.activity.requestsLast7d),
                })}
                acceleratingLabel={t('admin:activity.accelerating')}
              />
            </div>
          </Block>

          <Block title={t('admin:attention.title')} hint={t('admin:attention.hint')}>
            {!alerted && (
              <Notice tone="success" className="mb-4">
                {t('admin:attention.calm')}
              </Notice>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricTile
                icon={Hourglass}
                tone={overview.attention.requestsPendingOverADay > 0 ? 'warn' : 'plain'}
                label={t('admin:metric.staleRequests')}
                value={formatCount(overview.attention.requestsPendingOverADay)}
                hint={t('admin:metric.staleRequestsHint')}
              />
              <MetricTile
                icon={Wallet}
                tone={overview.attention.listingsWithoutAnyPrice > 0 ? 'warn' : 'plain'}
                label={t('admin:metric.pricelessListings')}
                value={formatCount(overview.attention.listingsWithoutAnyPrice)}
                hint={t('admin:metric.pricelessListingsHint')}
              />
              <MetricTile
                icon={Users}
                tone={overview.attention.accountsWithoutAnyActivity > 0 ? 'warn' : 'plain'}
                label={t('admin:metric.idleAccounts')}
                value={formatCount(overview.attention.accountsWithoutAnyActivity)}
                hint={t('admin:metric.idleAccountsHint')}
              />
            </div>
          </Block>
        </>
      )}
    </div>
  );
};
