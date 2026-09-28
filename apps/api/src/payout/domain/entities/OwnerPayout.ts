import { PayoutAccountStatus } from './PayoutAccount';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

// Ce qu'une location payée doit au loueur, lu sur la demande : le prix, la
// commission figée à la demande, l'arrivée du conducteur et le virement, s'il
// est parti.
export interface OwnerPayoutView {
  requestId: string;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  platformFeeInCents: number | null;
  startsAt: Date;
  arrivedAt: Date | null;
  transferredAt: Date | null;
  transferredAmountInCents: number | null;
}

// HELD : retenu par la plateforme jusqu'à la libération (D-22).
// AWAITING_ACCOUNT : libéré, mais le loueur n'a pas encore de compte prêt.
// SENDING : libéré, compte prêt ; le prochain balayage vire.
// SENT : viré.
export type OwnerPayoutStatus =
  'HELD' | 'AWAITING_ACCOUNT' | 'SENDING' | 'SENT';

// Une demande sans commission figée (aucune depuis la migration, mais le
// modèle l'admet) prend la commission en vigueur, comme `CancelRental` prend
// le délai en vigueur pour une demande sans échéance.
export const ownerShareOf = (
  priceInCents: number,
  platformFeeInCents: number | null,
  currentFeePercent: number,
): number =>
  priceInCents -
  (platformFeeInCents ?? Math.round((priceInCents * currentFeePercent) / 100));

// D-22 : l'argent est libéré au premier de deux événements — l'arrivée
// confirmée par le conducteur, ou le délai après le premier instant loué.
export const releaseAtOf = (
  startsAt: Date,
  arrivedAt: Date | null,
  releaseDelayInHours: number,
): Date => {
  const byDelay = new Date(
    startsAt.getTime() + releaseDelayInHours * MILLISECONDS_PER_HOUR,
  );
  return arrivedAt !== null && arrivedAt.getTime() < byDelay.getTime()
    ? arrivedAt
    : byDelay;
};

export const ownerPayoutStatusOf = (
  view: OwnerPayoutView,
  now: Date,
  releaseDelayInHours: number,
  accountStatus: PayoutAccountStatus,
): OwnerPayoutStatus => {
  if (view.transferredAt !== null) return 'SENT';
  const releaseAt = releaseAtOf(
    view.startsAt,
    view.arrivedAt,
    releaseDelayInHours,
  );
  if (now.getTime() < releaseAt.getTime()) return 'HELD';
  return accountStatus === 'READY' ? 'SENDING' : 'AWAITING_ACCOUNT';
};
