import { ArrowUpRight, Banknote, CircleCheck, Clock3, Landmark, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PayoutStatus, PayoutSummary } from '@front/app/payout/domain/entities/Payout';
import { stripePageRequested } from '@front/app/payout/domain/use-cases/open-stripe-page/openStripePageEpic';
import { readPayoutsRequested } from '@front/app/payout/domain/use-cases/read-payouts/readPayoutsEpic';
import { formatCentsPrecisely, formatDay, formatShortDay } from '@front/lib/format';
import { selectStripePageError, selectStripePagePending } from '@front/selectors/payout/payoutSelectors';

import { paymentBrowser } from '../adapters/InAppBrowserPaymentPageNavigator';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { MetricTile } from './MetricTile';
import { RowList } from './RequestRows';
import { Badge, type BadgeTone } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Notice } from './ui/Notice';
import { Display, Text, Ticket } from './ui/Text';

const TONE: Record<PayoutStatus, BadgeTone> = {
  HELD: 'neutral',
  AWAITING_ACCOUNT: 'warn',
  SENDING: 'accent',
  SENT: 'ok',
};

const dayOf = (day: string): string => formatShortDay(`${day}T00:00:00.000Z`);

/**
 * « Versements », comme sur le site : les coordonnées bancaires, qui se
 * saisissent chez Stripe dans un navigateur intégré, puis chaque location.
 * Refermer les pages de Stripe relit l'état du compte.
 */
export const PayoutsSection = ({ summary }: { summary: PayoutSummary }) => {
  const { t } = useTranslation(['account', 'common']);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const opening = useAppSelector(selectStripePagePending);
  const error = useAppSelector(selectStripePageError);
  const browserOpen = useSyncExternalStore(paymentBrowser.subscribe, paymentBrowser.isOpen);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (wasOpen.current && !browserOpen) dispatch(readPayoutsRequested());
    wasOpen.current = browserOpen;
  }, [browserOpen, dispatch]);

  const fee = summary.feePercent;
  const release = t('common:unit.hour', { count: summary.releaseDelayHours });
  const account = {
    MISSING: { icon: Landmark, title: t('account:payouts.missingTitle'), body: t('account:payouts.missingBody', { fee, release }), action: t('account:payouts.add'), page: 'onboarding' as const },
    INCOMPLETE: { icon: Clock3, title: t('account:payouts.incompleteTitle'), body: t('account:payouts.incompleteBody'), action: t('account:payouts.resume'), page: 'onboarding' as const },
    READY: { icon: CircleCheck, title: t('account:payouts.readyTitle'), body: t('account:payouts.readyBody', { fee }), action: t('account:payouts.dashboard'), page: 'dashboard' as const },
  }[summary.accountStatus];
  const AccountIcon = account.icon;

  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSunken }}>
            <AccountIcon size={20} color={summary.accountStatus === 'READY' ? colors.ok : colors.fg} />
          </View>
          <Display size={20} weight="bold" style={{ flex: 1 }}>
            {account.title}
          </Display>
        </View>
        <Text size={14} tone="muted">
          {account.body}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <ShieldCheck size={14} color={colors.fgSubtle} style={{ marginTop: 2 }} />
          <Text size={12} tone="subtle" style={{ flex: 1 }}>
            {t('account:payouts.stripeNote')}
          </Text>
        </View>
        <Button
          variant={summary.accountStatus === 'READY' ? 'outline' : 'primary'}
          icon={ArrowUpRight}
          loading={opening}
          label={account.action}
          onPress={() => dispatch(stripePageRequested({ page: account.page }))}
        />
      </Card>

      {error !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {error}
        </Notice>
      )}

      <View style={{ flexDirection: 'row', gap: 12 }}>
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
      </View>

      <Ticket>{t('account:payouts.listTitle')}</Ticket>
      {summary.payouts.length === 0 ? (
        <Text size={14} tone="muted" center style={{ paddingVertical: 20 }}>
          {t('account:payouts.empty')}
        </Text>
      ) : (
        <RowList
          items={summary.payouts}
          keyOf={(payout) => payout.requestId}
          render={(payout) => {
            const date = payout.status === 'SENT' && payout.transferredAt !== null ? payout.transferredAt : payout.releaseAt;
            return (
              <View style={{ padding: 16, gap: 8 }}>
                <Text size={15} weight="medium" numberOfLines={2}>
                  {payout.address} · <Text size={14} style={{ fontFamily: fonts.mono.medium }}>{payout.box}</Text>
                </Text>
                <Text size={12} tone="subtle" tabular>
                  {t('account:row.period', { from: dayOf(payout.fromDay), to: dayOf(payout.toDay) })}
                </Text>
                <Text size={14} tone="muted" tabular>
                  {t('account:payouts.receive', {
                    amount: formatCentsPrecisely(payout.amountInCents),
                    price: formatCentsPrecisely(payout.priceInCents),
                  })}
                </Text>
                <Badge tone={TONE[payout.status]} dot label={t(`account:payouts.status.${payout.status}`, { date: formatDay(date) })} />
              </View>
            );
          }}
        />
      )}
    </View>
  );
};
