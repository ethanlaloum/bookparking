import { ArrowUpRight, Banknote, CheckCircle2, Clock3, Landmark, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PayoutLine, PayoutStatus, PayoutSummary } from '../app/payout/domain/entities/Payout';
import { stripePageRequested } from '../app/payout/domain/use-cases/open-stripe-page/openStripePageEpic';
import { formatCentsPrecisely, formatDay, formatShortDay } from '../lib/format';
import {
  selectStripePageError,
  selectStripePagePending,
} from '../selectors/payout/payoutSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { MetricTile } from './MetricTile';
import { Notice } from './Notice';
import { Badge } from './ui/badge';
import type { BadgeVariantProps } from './ui/badgeVariants';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Spinner } from './ui/spinner';

const TONE: Record<PayoutStatus, NonNullable<BadgeVariantProps['tone']>> = {
  HELD: 'neutral',
  AWAITING_ACCOUNT: 'warn',
  SENDING: 'accent',
  SENT: 'ok',
};

const dayOf = (day: string): string => formatShortDay(`${day}T00:00:00.000Z`);

const PayoutRow = ({ payout }: { payout: PayoutLine }) => {
  const { t } = useTranslation('account');
  const date = payout.status === 'SENT' && payout.transferredAt !== null ? payout.transferredAt : payout.releaseAt;

  return (
    <li className="flex flex-col gap-2 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">
          {payout.address} · <span className="font-mono text-[0.9em]">{payout.box}</span>
        </p>
        <p className="tabular mt-1 text-xs text-fg-subtle">
          {t('row.period', { from: dayOf(payout.fromDay), to: dayOf(payout.toDay) })}
        </p>
      </div>
      <p className="tabular text-sm text-fg-muted">
        {t('payouts.receive', {
          amount: formatCentsPrecisely(payout.amountInCents),
          price: formatCentsPrecisely(payout.priceInCents),
        })}
      </p>
      <Badge tone={TONE[payout.status]} className="shrink-0 self-start sm:self-auto">
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {t(`payouts.status.${payout.status}`, { date: formatDay(date) })}
      </Badge>
    </li>
  );
};

/**
 * L'onglet « Versements » du loueur : ses coordonnées bancaires, qui se
 * saisissent chez Stripe, puis ce que chaque location lui rapporte, retenu,
 * libéré ou viré. Le taux vient de l'api, jamais d'une constante de l'écran.
 */
export const PayoutsPanel = ({ summary }: { summary: PayoutSummary }) => {
  const { t } = useTranslation(['account', 'common']);
  const dispatch = useAppDispatch();
  const opening = useAppSelector(selectStripePagePending);
  const error = useAppSelector(selectStripePageError);
  const fee = summary.feePercent;

  const open = (page: 'onboarding' | 'dashboard') => dispatch(stripePageRequested({ page }));

  const account = {
    MISSING: {
      icon: Landmark,
      title: t('account:payouts.missingTitle'),
      body: t('account:payouts.missingBody', { fee }),
      action: t('account:payouts.add'),
      page: 'onboarding' as const,
      tone: 'border-accent/40 bg-accent-soft/40',
    },
    INCOMPLETE: {
      icon: Clock3,
      title: t('account:payouts.incompleteTitle'),
      body: t('account:payouts.incompleteBody'),
      action: t('account:payouts.resume'),
      page: 'onboarding' as const,
      tone: 'border-warn/30 bg-warn-bg/50',
    },
    READY: {
      icon: CheckCircle2,
      title: t('account:payouts.readyTitle'),
      body: t('account:payouts.readyBody', { fee }),
      action: t('account:payouts.dashboard'),
      page: 'dashboard' as const,
      tone: 'border-ok/30 bg-ok-bg/50',
    },
  }[summary.accountStatus];
  const AccountIcon = account.icon;

  return (
    <div className="space-y-6">
      <Card className={`animate-rise flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7 ${account.tone}`}>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-bg-raised text-fg shadow-[var(--shadow-panel)]">
          <AccountIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-fg">{account.title}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">{account.body}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {t('account:payouts.stripeNote')}
          </p>
        </div>
        <Button
          variant={summary.accountStatus === 'READY' ? 'outline' : 'primary'}
          disabled={opening}
          onClick={() => open(account.page)}
          className="shrink-0"
        >
          {opening ? <Spinner /> : <ArrowUpRight className="size-4" aria-hidden="true" />}
          {account.action}
        </Button>
      </Card>

      {error !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {error}
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricTile
          tone={summary.upcomingInCents > 0 ? 'accent' : 'plain'}
          icon={Clock3}
          label={t('account:payouts.upcoming')}
          value={formatCentsPrecisely(summary.upcomingInCents)}
          hint={t('account:payouts.upcomingHint')}
        />
        <MetricTile
          icon={Banknote}
          label={t('account:payouts.sent')}
          value={formatCentsPrecisely(summary.sentInCents)}
          hint={t('account:payouts.sentHint')}
        />
      </div>

      <section aria-label={t('account:payouts.listTitle')}>
        <h3 className="label-ticket mb-3 text-fg-subtle">{t('account:payouts.listTitle')}</h3>
        {summary.payouts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center text-sm text-fg-muted">
            {t('account:payouts.empty')}
          </p>
        ) : (
          <Card className="overflow-hidden">
            <ul>
              {summary.payouts.map((payout) => (
                <PayoutRow key={payout.requestId} payout={payout} />
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
};
