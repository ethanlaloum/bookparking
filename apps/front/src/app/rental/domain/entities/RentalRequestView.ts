import type { components } from '../../../../api/schema';
import { formatCentsPrecisely } from '../../../../lib/format';

export type RentalRequestView = components['schemas']['RentalRequest'];
export type RentalRequestStatus = RentalRequestView['status'];
export type RentalMoney = RentalRequestView['money'];

export const isPending = (request: RentalRequestView): boolean =>
  request.status === 'PENDING';

export const isConfirmed = (request: RentalRequestView): boolean =>
  request.status === 'CONFIRMED';

/**
 * Les revenus sont la somme des demandes confirmées, et d'elles seules : une
 * demande en attente n'est pas un revenu tant que le propriétaire ne l'a pas
 * acceptée, et une demande expirée n'en a jamais été un. Le montant vient de
 * `priceInCents`, figé par l'api au moment de la demande — le recalculer depuis
 * la grille actuelle mentirait sur toute place dont les tarifs ont changé
 * depuis.
 */
export const confirmedRevenueInCents = (
  requests: readonly RentalRequestView[],
): number =>
  requests
    .filter(isConfirmed)
    .reduce((total, request) => total + request.priceInCents, 0);

export const pendingRevenueInCents = (
  requests: readonly RentalRequestView[],
): number =>
  requests
    .filter(isPending)
    .reduce((total, request) => total + request.priceInCents, 0);

export const countByStatus = (
  requests: readonly RentalRequestView[],
): Record<RentalRequestStatus, number> => {
  const counts: Record<RentalRequestStatus, number> = {
    AWAITING_PAYMENT: 0,
    PENDING: 0,
    CONFIRMED: 0,
    EXPIRED: 0,
    CANCELLED: 0,
    ABANDONED: 0,
    PAYMENT_FAILED: 0,
  };
  for (const request of requests) counts[request.status] += 1;
  return counts;
};

export const rentedNightCount = (request: RentalRequestView): number => {
  const MILLISECONDS_PER_DAY = 86_400_000;
  const from = Date.parse(`${request.fromDay}T00:00:00.000Z`);
  const to = Date.parse(`${request.toDay}T00:00:00.000Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / MILLISECONDS_PER_DAY) + 1;
};

export const byMostRecentlyRequested = (
  left: RentalRequestView,
  right: RentalRequestView,
): number => Date.parse(right.requestedAt) - Date.parse(left.requestedAt);

export type MoneyLabelKey =
  | 'awaitingPayment'
  | 'abandoned'
  | 'paymentFailed'
  | 'holdAwaitingOwner'
  | 'captured'
  | 'expiredReleasing'
  | 'expiredReleased'
  | 'cancelledReleasing'
  | 'cancelledReleased'
  | 'cancelledRefunding'
  | 'cancelledRefunded'
  | 'cancelledKept'
  | 'pendingWithoutPayment'
  | 'confirmedWithoutPayment'
  | 'expiredWithoutPayment'
  | 'cancelledWithoutPayment';

/**
 * Ce que le conducteur lit de son argent, demande par demande. Le statut seul
 * ne suffit pas : une demande expirée dont l'empreinte est encore à lever et
 * une demande expirée dont rien n'a jamais été pris ne disent pas la même
 * chose. Le montant est donné au centime, comme sur la page de Stripe.
 */
export const moneyLabelOf = (
  request: RentalRequestView,
): { key: MoneyLabelKey; amount: string } => {
  const amount = formatCentsPrecisely(request.priceInCents);
  const label = (key: MoneyLabelKey) => ({ key, amount });
  const { status, money } = request;

  if (status === 'AWAITING_PAYMENT') return label('awaitingPayment');
  if (status === 'ABANDONED') return label('abandoned');
  if (status === 'PAYMENT_FAILED') return label('paymentFailed');
  if (status === 'PENDING')
    return label(money === 'AUTHORIZED' ? 'holdAwaitingOwner' : 'pendingWithoutPayment');
  if (status === 'CONFIRMED')
    return label(money === 'CAPTURED' ? 'captured' : 'confirmedWithoutPayment');
  if (status === 'EXPIRED') {
    if (money === 'RELEASE_DUE') return label('expiredReleasing');
    if (money === 'RELEASED') return label('expiredReleased');
    return label('expiredWithoutPayment');
  }
  if (money === 'RELEASE_DUE') return label('cancelledReleasing');
  if (money === 'RELEASED') return label('cancelledReleased');
  if (money === 'REFUND_DUE') return label('cancelledRefunding');
  if (money === 'REFUNDED') return label('cancelledRefunded');
  if (money === 'CAPTURED') return label('cancelledKept');
  return label('cancelledWithoutPayment');
};
