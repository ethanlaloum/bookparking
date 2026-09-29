import type { components } from '../../../../api/schema';

export type RentalRequestView = components['schemas']['RentalRequest'];
export type RentalRequestStatus = RentalRequestView['status'];

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
    PENDING: 0,
    CONFIRMED: 0,
    EXPIRED: 0,
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
