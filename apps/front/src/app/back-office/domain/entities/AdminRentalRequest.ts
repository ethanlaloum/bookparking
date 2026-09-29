import type { components } from '../../../../api/schema';

export type AdminRentalRequest = components['schemas']['AdminRentalRequest'];
export type AdminRentalRequestStatus = AdminRentalRequest['status'];

const DAY_IN_MILLISECONDS = 86_400_000;

export const isPending = (request: AdminRentalRequest): boolean => request.status === 'PENDING';

/**
 * Report ligne à ligne du `attentionOverview` de l'api : une demande encore en
 * attente dont la demande remonte à plus de vingt-quatre heures. L'api compare
 * à l'instant de la requête, l'écran à l'instant du rendu — les deux peuvent
 * donc différer d'une demande pendant la minute où elle bascule, et c'est la
 * seule divergence acceptable.
 */
export const hasWaitedOverADay = (request: AdminRentalRequest, now: Date): boolean => {
  if (!isPending(request)) return false;
  const requestedAt = Date.parse(request.requestedAt);
  if (Number.isNaN(requestedAt)) return false;
  return requestedAt < now.getTime() - DAY_IN_MILLISECONDS;
};

/**
 * Seule une demande en attente ou confirmée peut encore être annulée : une
 * demande expirée ou déjà annulée n'a plus d'effet à défaire, et offrir le
 * bouton ferait promettre à l'écran une action que l'api refuserait.
 */
export const isCancellable = (request: AdminRentalRequest): boolean =>
  request.status === 'PENDING' || request.status === 'CONFIRMED';

export const byMostRecentlyRequested = (
  left: AdminRentalRequest,
  right: AdminRentalRequest,
): number => Date.parse(right.requestedAt) - Date.parse(left.requestedAt);

export const countWaitingOverADay = (
  requests: readonly AdminRentalRequest[],
  now: Date,
): number => requests.filter((request) => hasWaitedOverADay(request, now)).length;
