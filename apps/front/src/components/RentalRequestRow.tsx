import { CalendarRange, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  rentedNightCount,
  type RentalRequestStatus,
  type RentalRequestView,
} from '../app/rental/domain/entities/RentalRequestView';
import { formatCents, formatShortDay } from '../lib/format';
import { Badge } from './ui/badge';
import type { BadgeVariantProps } from './ui/badgeVariants';

const TONE: Record<RentalRequestStatus, NonNullable<BadgeVariantProps['tone']>> = {
  PENDING: 'warn',
  CONFIRMED: 'ok',
  EXPIRED: 'neutral',
};

export const RentalRequestRow = ({
  request,
  action,
}: {
  request: RentalRequestView;
  action?: ReactNode;
}) => {
  const { t } = useTranslation('account');
  const nights = rentedNightCount(request);

  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1">
        <p className="flex items-start gap-1.5 font-medium text-fg">
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0">
            {request.address} · {request.box}
          </span>
        </p>
        <p className="tabular mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5.5 text-xs text-fg-subtle">
          <span className="flex items-center gap-1.5">
            <CalendarRange className="size-3.5" aria-hidden="true" />
            {t('row.period', {
              from: formatShortDay(`${request.fromDay}T00:00:00.000Z`),
              to: formatShortDay(`${request.toDay}T00:00:00.000Z`),
            })}
          </span>
          <span>{t('row.nights', { count: nights })}</span>
        </p>
      </div>

      <p className="tabular font-display text-lg font-semibold text-fg sm:w-24 sm:text-right">
        {formatCents(request.priceInCents)}
      </p>

      <Badge tone={TONE[request.status]} className="shrink-0 sm:w-28 sm:justify-center">
        {t(`status.${request.status}`)}
      </Badge>

      {action !== undefined && <div className="shrink-0">{action}</div>}
    </li>
  );
};
