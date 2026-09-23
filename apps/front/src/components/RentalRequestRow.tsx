import { CalendarRange } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  rentedNightCount,
  type RentalRequestStatus,
  type RentalRequestView,
} from '../app/rental/domain/entities/RentalRequestView';
import { formatCents, formatShortDay } from '../lib/format';
import { BayThumbnail } from './art/BayThumbnail';
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
    <li className="flex flex-col gap-4 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-bg-sunken/40 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <BayThumbnail box={request.box} className="h-16 w-13 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <p className="font-medium text-fg">
            {request.address} · <span className="font-mono text-[0.9em]">{request.box}</span>
          </p>
          <p className="tabular mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <CalendarRange className="size-3.5" aria-hidden="true" />
              {t('row.period', {
                from: formatShortDay(`${request.fromDay}T00:00:00.000Z`),
                to: formatShortDay(`${request.toDay}T00:00:00.000Z`),
              })}
            </span>
            <span className="rounded-full bg-bg-sunken px-2 py-0.5 font-medium">
              {t('row.nights', { count: nights })}
            </span>
          </p>
        </div>
      </div>

      <p className="tabular font-display text-xl font-bold tracking-tight text-fg sm:w-24 sm:text-right">
        {formatCents(request.priceInCents)}
      </p>

      <Badge tone={TONE[request.status]} className="shrink-0 self-start sm:w-28 sm:justify-center sm:self-auto">
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {t(`status.${request.status}`)}
      </Badge>

      {action !== undefined && <div className="shrink-0">{action}</div>}
    </li>
  );
};
