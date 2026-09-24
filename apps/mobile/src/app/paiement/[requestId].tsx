import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, CreditCard, RotateCcw } from 'lucide-react-native';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { moneyLabelOf } from '@front/app/rental/domain/entities/RentalRequestView';
import { abandonRentalRequestRequested } from '@front/app/rental/domain/use-cases/abandon-rental-request/abandonRentalRequestEpic';
import { listMyRentalRequestsRequested } from '@front/app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import {
  selectAbandonedRentalRequestId,
  selectAbandonRentalRequestFailed,
  selectMyRentalRequests,
  selectMyRentalRequestsLoaded,
} from '@front/selectors/rental/rentalSelectors';

import { paymentBrowser } from '../../adapters/InAppBrowserPaymentPageNavigator';
import { ParkingMark } from '../../components/art/Glyphs';
import { STATUS_TONE } from '../../components/RequestRows';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Rise } from '../../components/ui/Layout';
import { Notice } from '../../components/ui/Notice';
import { Display, Text, Ticket } from '../../components/ui/Text';
import { useAppDispatch, useAppSelector } from '../../store/redux';
import { useTheme } from '../../theme/useTheme';

const POLL_EVERY_MILLISECONDS = 2500;
// Après la fermeture de la page de Stripe, l'événement signé peut encore
// arriver : trois relectures avant de dire au conducteur qu'il est parti sans
// payer, trente au plus avant de se taire.
const GRACE_POLLS = 3;
const MAXIMUM_POLLS_AFTER_CLOSE = 30;

/**
 * Le pendant mobile de `PaymentReturnPage`. Sur le site, Stripe renvoie le
 * navigateur vers le front ; ici, la page de Stripe est ouverte par-dessus
 * l'app et son adresse de retour est celle du site, que le téléphone ne sait
 * pas joindre. Peu importe : le retour ne vaut pas paiement. L'écran relit la
 * demande tant que la page est ouverte, et la referme lui-même dès que
 * l'empreinte est posée — c'est l'événement signé reçu par l'api qui tranche.
 */
export default function PaymentScreen() {
  const { requestId = '', place } = useLocalSearchParams<{ requestId: string; place?: string }>();
  const { t } = useTranslation(['rental', 'account', 'common', 'mobile']);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const browserOpen = useSyncExternalStore(paymentBrowser.subscribe, paymentBrowser.isOpen);
  const mine = useAppSelector(selectMyRentalRequests);
  const loaded = useAppSelector(selectMyRentalRequestsLoaded);
  const abandonedId = useAppSelector(selectAbandonedRentalRequestId);
  const abandonFailed = useAppSelector(selectAbandonRentalRequestFailed);
  const abandonPending = useAppSelector((state) => state.core.rental.abandon.state === 'pending');
  const [closedPolls, setClosedPolls] = useState(0);
  const [tick, setTick] = useState(0);

  const request = mine.find((candidate) => candidate.id === requestId) ?? null;
  const awaiting = request === null || request.status === 'AWAITING_PAYMENT';
  const abandoned = abandonedId === requestId;

  useEffect(() => {
    if (requestId !== '') dispatch(listMyRentalRequestsRequested());
  }, [dispatch, requestId]);

  useEffect(() => {
    if (!awaiting || abandoned || abandonPending) return;
    if (!browserOpen && closedPolls >= MAXIMUM_POLLS_AFTER_CLOSE) return;
    const timer = setTimeout(() => {
      if (!paymentBrowser.isOpen()) setClosedPolls((current) => current + 1);
      setTick((current) => current + 1);
      dispatch(listMyRentalRequestsRequested());
    }, POLL_EVERY_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [abandonPending, abandoned, awaiting, browserOpen, closedPolls, dispatch, tick]);

  // L'empreinte est posée : la page de Stripe n'a plus rien à montrer.
  useEffect(() => {
    if (!awaiting && browserOpen) paymentBrowser.close();
  }, [awaiting, browserOpen]);

  // Abandonnée, la demande rend ses dates : retour à la fiche, qui le dit.
  useEffect(() => {
    if (!abandoned || place === undefined) return;
    router.dismissTo({ pathname: '/place/[id]', params: { id: place, paiement: 'abandonne' } });
  }, [abandoned, place]);

  const left = awaiting && !browserOpen && closedPolls >= GRACE_POLLS;
  const settled = request !== null && !awaiting;
  const sent = settled && (request.status === 'PENDING' || request.status === 'CONFIRMED');

  const heading = abandonPending
    ? t('rental:payment.abandoning')
    : browserOpen && awaiting
      ? t('mobile:payment.inBrowser')
      : left
        ? t('mobile:payment.left')
        : awaiting
          ? t('rental:payment.verifying')
          : sent
            ? t('rental:payment.sent')
            : t(`account:status.${request?.status ?? 'AWAITING_PAYMENT'}`);

  const money = request === null ? null : moneyLabelOf(request);

  const toBookings = (): void => {
    router.dismissAll();
    router.navigate('/reservations');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }}
    >
      <Rise>
        <ParkingMark size={44} />
        <Ticket style={{ marginTop: 28 }}>{t('rental:payment.title')}</Ticket>
        <Display size={34} style={{ marginTop: 8 }} accessibilityLiveRegion="polite">
          {heading}
        </Display>
      </Rise>

      <Rise order={1}>
        <Card lifted style={{ marginTop: 28, gap: 16 }}>
          {abandonPending ? (
            <Row>
              <ActivityIndicator color={colors.accent} />
              <Text size={14} tone="muted" style={{ flex: 1 }}>
                {t('rental:payment.abandoning')}
              </Text>
            </Row>
          ) : browserOpen && awaiting ? (
            <Row>
              <ActivityIndicator color={colors.accent} />
              <Text size={14} tone="muted" style={{ flex: 1 }}>
                {t('mobile:payment.inBrowserBody')}
              </Text>
            </Row>
          ) : left ? (
            <>
              <Text size={14} tone="muted">
                {t('mobile:payment.leftBody')}
              </Text>
              {abandonFailed && <Notice tone="error">{t('common:error.unexpected')}</Notice>}
              <Button
                icon={CreditCard}
                label={t('mobile:payment.resume')}
                onPress={() => {
                  setClosedPolls(0);
                  paymentBrowser.reopen();
                }}
              />
              <Button
                variant="outline"
                icon={RotateCcw}
                label={t('mobile:payment.abandon')}
                onPress={() => dispatch(abandonRentalRequestRequested({ requestId }))}
              />
            </>
          ) : awaiting ? (
            loaded && request === null && closedPolls >= MAXIMUM_POLLS_AFTER_CLOSE ? (
              <Notice tone="error">{t('rental:payment.notFound')}</Notice>
            ) : (
              <Row>
                <ActivityIndicator color={colors.accent} />
                <Text size={14} tone="muted" style={{ flex: 1 }}>
                  {t('rental:payment.verifyingBody')}
                </Text>
              </Row>
            )
          ) : (
            request !== null && (
              <>
                <Badge tone={STATUS_TONE[request.status]} dot large label={t(`account:status.${request.status}`)} />
                <Text weight="medium">{money !== null && t(`account:money.${money.key}`, { amount: money.amount })}</Text>
                {sent && (
                  <Text size={14} tone="muted" style={{ lineHeight: 22 }}>
                    {t('rental:payment.sentBody')}
                  </Text>
                )}
              </>
            )
          )}

          {settled && (
            <Button variant="outline" trailingIcon={ArrowRight} label={t('rental:payment.toMyRequests')} onPress={toBookings} />
          )}
        </Card>
      </Rise>

      {settled && place !== undefined && (
        <Button variant="ghost" label={t('mobile:payment.backToListing')} onPress={() => router.back()} style={{ marginTop: 12, alignSelf: 'center' }} />
      )}
    </ScrollView>
  );
}

const Row = ({ children }: { children: ReactNode }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{children}</View>
);
