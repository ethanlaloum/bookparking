import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { ConfirmedRental } from '../entities/ConfirmedRental';
import { RentalPlace } from '../entities/RentalPlace';
import { RentalRequest } from '../entities/RentalRequest';
import { RentalPeriod } from '../services/computeRentalPrice';
import { CancellingParty } from '../entities/RentalCancellation';
import { RentalIssueState } from '../entities/RentalIssue';
import {
  MoneyOwed,
  MoneyState,
  RentalRequestStatus,
} from '../entities/RentalMoney';

// Ce que la confirmation a besoin de savoir d'une demande, et rien de plus :
// qui possède l'annonce visée, qui a demandé, et si c'est déjà confirmé. Le
// propriétaire vient de `listings.owner_id`, lu par jointure — le contexte
// `rental` lit cette table, il n'importe jamais une classe de `listing/`.
export interface RentalRequestSummary {
  id: string;
  ownerId: string;
  renterId: string;
  isConfirmed: boolean;
  isExpired: boolean;
  status: RentalRequestStatus;
  money: MoneyState;
  paymentId: string | null;
  checkoutSessionId: string | null;
  startsAt: Date;
  freeCancellationUntil: Date | null;
}

// Ce qu'un tableau de bord montre d'une demande, et qu'aucune entité ne porte :
// l'adresse et le box vivent sur `listings`, la demande n'en garde qu'une clé.
// C'est un modèle de lecture, pas un agrégat — il ne se reconstitue pas, il
// s'affiche. Les deux finders ci-dessous le lisent par jointure, comme
// `findRequestSummary` lit déjà `owner_id`.
export interface RentalRequestView {
  id: string;
  listingId: string;
  address: string;
  box: string;
  ownerId: string;
  renterId: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  status: RentalRequestStatus;
  money: MoneyState;
  requestedAt: Date;
  confirmedAt: Date | null;
  startsAt: Date;
  // Le dernier instant loué, heure de Paris, et l'instant de l'empreinte :
  // ce qui borne les consignes et l'échéance de réponse.
  endsAt: Date;
  holdPlacedAt: Date | null;
  freeCancellationUntil: Date | null;
  // `listings.access_description`, lue telle quelle : c'est le cas d'usage
  // qui décide qui la voit (`presentRentalRequest`).
  accessInstructions: string;
  platformFeeInCents: number | null;
  arrivedAt: Date | null;
  // Le délai de réponse figé sur la demande, d'où l'échéance affichée.
  requestExpiryHours: number;
  // Si l'argent est déjà parti vers le loueur, et la réclamation du
  // conducteur, s'il y en a une : ce qui décide s'il peut encore se plaindre.
  transferred: boolean;
  issue: RentalIssueState | null;
}

// Ce qu'une demande déjà créée sous un identifiant d'intention permet de
// rejouer : la demande elle-même, et l'adresse de sa page de paiement — `null`
// tant que la page n'est pas ouverte.
export interface IdempotentRentalRequest {
  rentalRequest: RentalRequest;
  checkoutUrl: string | null;
}

// Une demande que l'expiration vient d'écrire, et ses deux parties : le
// conducteur et le loueur en sont prévenus dans la même transaction.
export interface LapsedRentalRequest {
  requestId: string;
  renterId: string;
  ownerId: string;
}

export interface AbandonedUnpaidRequest {
  requestId: string;
  checkoutSessionId: string | null;
}

export interface RentalRepository {
  createRequest(
    rentalRequest: RentalRequest,
    trx?: GenericTransaction,
  ): Promise<void>;
  findConfirmedByPlace(
    place: RentalPlace,
    trx?: GenericTransaction,
  ): Promise<ConfirmedRental[]>;
  findRequestSummary(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<RentalRequestSummary | null>;
  // Rend `false` quand la demande n'était plus en attente au moment d'écrire.
  confirmRequest(
    requestId: string,
    confirmedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  // Rend les demandes que cet appel a expirées, et elles seules : une demande
  // déjà expirée n'y revient pas, ni ses parties n'en sont prévenues deux fois.
  // Chacune expire selon le délai figé sur elle, jamais selon le délai du jour.
  expireLapsedPendingRequests(
    now: Date,
    trx?: GenericTransaction,
  ): Promise<LapsedRentalRequest[]>;
  findAllByRenter(
    renterId: string,
    trx?: GenericTransaction,
  ): Promise<RentalRequestView[]>;
  findAllForOwner(
    ownerId: string,
    trx?: GenericTransaction,
  ): Promise<RentalRequestView[]>;

  // Chaque transition ci-dessous filtre sur l'état qu'elle quitte : rejouée,
  // elle ne trouve plus rien à changer et rend `false`. C'est là, et non dans
  // les cas d'usage, qu'est l'idempotence face aux événements que Stripe
  // renvoie et aux balayages qui se chevauchent.
  attachPaymentPage(
    requestId: string,
    checkoutSessionId: string,
    checkoutUrl: string,
    trx?: GenericTransaction,
  ): Promise<void>;
  findByIdempotencyKey(
    renterId: string,
    idempotencyKey: string,
    trx?: GenericTransaction,
  ): Promise<IdempotentRentalRequest | null>;
  forgetIdempotencyKey(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<void>;
  // Ne touche que les demandes impayées de ce conducteur : celles d'un autre
  // retiennent leurs dates, et c'est la contrainte d'exclusion qui tranche.
  // Filtre sur `PENDING` et `CONFIRMED` : une seconde annulation ne trouve
  // plus rien, et la dette envers le conducteur ne naît qu'une fois.
  markCancelledBy(
    requestId: string,
    party: CancellingParty,
    moneyAfter: MoneyState,
    cancelledAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  abandonOwnUnpaidRequestsOverlapping(
    renterId: string,
    place: RentalPlace,
    period: RentalPeriod,
    trx?: GenericTransaction,
  ): Promise<AbandonedUnpaidRequest[]>;
  markHoldPlaced(
    requestId: string,
    paymentId: string,
    placedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  markAbandoned(requestId: string, trx?: GenericTransaction): Promise<boolean>;
  // Filtre sur `CONFIRMED` et `arrived_at IS NULL` : l'arrivée ne s'écrit
  // qu'une fois, et jamais sur une réservation annulée entre-temps.
  markArrived(
    requestId: string,
    arrivedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  oweReleaseOfLateHold(
    requestId: string,
    paymentId: string,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  markPaymentFailed(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  abandonUnpaidRequestsSince(
    deadline: Date,
    trx?: GenericTransaction,
  ): Promise<number>;
  expireLapsedHolds(
    now: Date,
    trx?: GenericTransaction,
  ): Promise<LapsedRentalRequest[]>;
  findMoneyOwed(trx?: GenericTransaction): Promise<MoneyOwed[]>;
  markReleased(requestId: string, trx?: GenericTransaction): Promise<boolean>;
  markRefunded(
    requestId: string,
    refundId: string,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  recordMissedCapture(
    requestId: string,
    confirmedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  oweRefundOfMissedCapture(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<boolean>;
}
