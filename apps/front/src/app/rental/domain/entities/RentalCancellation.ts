import { formatCentsPrecisely } from '../../../../lib/format';
import type { RentalRequestView } from './RentalRequestView';

export type CancellationTermsKind =
  | 'unavailable'
  | 'release'
  | 'refund'
  | 'nonRefundable'
  | 'ownerFullReturn'
  | 'nothingAtStake';

/**
 * Ce que coûte une annulation, lu avant de la confirmer — le même partage que
 * `moneyAfterCancellation` côté api, qui reste le juge. Une réservation qui a
 * commencé, ou qui n'attend ni le loueur ni son début, ne s'annule pas.
 * L'échéance est comparée incluse, comme le fait l'api.
 */
export const cancellationTermsOf = (
  request: RentalRequestView,
  perspective: 'renter' | 'owner',
  now: Date,
): { kind: CancellationTermsKind; amount: string } => {
  const amount = formatCentsPrecisely(request.priceInCents);
  const terms = (kind: CancellationTermsKind) => ({ kind, amount });

  const cancellable = request.status === 'PENDING' || request.status === 'CONFIRMED';
  if (!cancellable || now.getTime() >= Date.parse(request.startsAt))
    return terms('unavailable');
  if (perspective === 'owner') return terms('ownerFullReturn');
  if (request.money === 'AUTHORIZED') return terms('release');
  if (request.money !== 'CAPTURED') return terms('nothingAtStake');

  const deadline =
    request.freeCancellationUntil === null ? null : Date.parse(request.freeCancellationUntil);
  return terms(deadline === null || now.getTime() <= deadline ? 'refund' : 'nonRefundable');
};
