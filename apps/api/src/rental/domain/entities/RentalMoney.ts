export type RentalRequestStatus =
  | 'AWAITING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'ABANDONED'
  | 'PAYMENT_FAILED';

// L'argent d'une demande avance d'un état à l'autre sans jamais revenir en
// arrière. Les deux états « dus » sont une dette envers le conducteur, écrite
// dans la même ligne que le statut qui l'a fait naître : c'est le balayage qui
// l'éteint, et tant qu'elle n'est pas éteinte elle se relit à chaque passage.
export type MoneyState =
  | 'NONE'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'RELEASE_DUE'
  | 'RELEASED'
  | 'REFUND_DUE'
  | 'REFUNDED';

export type MoneyOperation = 'checkout' | 'capture' | 'release' | 'refund';

export interface MoneyOwed {
  requestId: string;
  paymentId: string;
  owed: 'RELEASE_DUE' | 'REFUND_DUE';
  status: RentalRequestStatus;
}

const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;

export const PAYMENT_PAGE_LIFETIME_IN_MINUTES = 30;
export const ABANDON_UNPAID_REQUEST_AFTER_HOURS = 2;

export const paymentPageExpiryOf = (requestedAt: Date): Date =>
  new Date(
    requestedAt.getTime() +
      PAYMENT_PAGE_LIFETIME_IN_MINUTES * MILLISECONDS_PER_MINUTE,
  );

export const unpaidAbandonDeadlineAt = (now: Date): Date =>
  new Date(
    now.getTime() - ABANDON_UNPAID_REQUEST_AFTER_HOURS * MILLISECONDS_PER_HOUR,
  );

export const holdExpiryDeadlineAt = (now: Date, expiryInHours: number): Date =>
  new Date(now.getTime() - expiryInHours * MILLISECONDS_PER_HOUR);

// Une clé par demande et par opération, jamais par tentative : c'est ce qui
// fait qu'un prélèvement ou un remboursement rejoué après une coupure rend le
// résultat du premier au lieu d'en produire un second.
export const idempotencyKeyOf = (
  requestId: string,
  operation: MoneyOperation,
): string => `${operation}-${requestId}`;

// Une demande en attente de paiement, ou abandonnée avant d'être payée, n'a
// jamais atteint le loueur : il ne doit ni la voir ni pouvoir la confirmer.
export const hasReachedTheOwner = (status: RentalRequestStatus): boolean =>
  status !== 'AWAITING_PAYMENT' && status !== 'ABANDONED';
