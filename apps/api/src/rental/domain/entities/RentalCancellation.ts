import { MoneyState } from './RentalMoney';

export type CancellingParty = 'RENTER' | 'OWNER';

export type CancellationOutcome =
  'RELEASED' | 'REFUNDED' | 'KEPT' | 'NOTHING_TO_RETURN';

/**
 * Ce que devient l'argent du conducteur quand une réservation est annulée.
 * Une empreinte est toujours levée : rien n'a été prélevé. Un prélèvement est
 * remboursé si le loueur annule, ou si le conducteur annule jusqu'à
 * l'échéance incluse ; au-delà, il est gardé (D-12, décision de JP du
 * 23/09/2026).
 */
export const moneyAfterCancellation = (params: {
  party: CancellingParty;
  money: MoneyState;
  cancelledAt: Date;
  freeCancellationUntil: Date;
}): { money: MoneyState; outcome: CancellationOutcome } => {
  if (params.money === 'AUTHORIZED')
    return { money: 'RELEASE_DUE', outcome: 'RELEASED' };
  if (params.money !== 'CAPTURED')
    return { money: params.money, outcome: 'NOTHING_TO_RETURN' };
  const inTime =
    params.cancelledAt.getTime() <= params.freeCancellationUntil.getTime();
  if (params.party === 'OWNER' || inTime)
    return { money: 'REFUND_DUE', outcome: 'REFUNDED' };
  return { money: 'CAPTURED', outcome: 'KEPT' };
};

export const outcomeOfCancelledMoney = (
  money: MoneyState,
): CancellationOutcome => {
  if (money === 'REFUND_DUE' || money === 'REFUNDED') return 'REFUNDED';
  if (money === 'RELEASE_DUE' || money === 'RELEASED') return 'RELEASED';
  if (money === 'CAPTURED') return 'KEPT';
  return 'NOTHING_TO_RETURN';
};
