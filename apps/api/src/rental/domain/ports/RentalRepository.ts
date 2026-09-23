import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { ConfirmedRental } from '../entities/ConfirmedRental';
import { RentalPlace } from '../entities/RentalPlace';
import { RentalRequest } from '../entities/RentalRequest';
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
  confirmRequest(
    requestId: string,
    confirmedAt: Date,
    trx?: GenericTransaction,
  ): Promise<void>;
  // Rend le nombre de demandes expirées, pour que l'appelant puisse le
  // journaliser ou l'affirmer dans un test.
  expireRequestsPendingSince(
    deadline: Date,
    trx?: GenericTransaction,
  ): Promise<number>;
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
    trx?: GenericTransaction,
  ): Promise<void>;
  markHoldPlaced(
    requestId: string,
    paymentId: string,
    placedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  markAbandoned(requestId: string, trx?: GenericTransaction): Promise<boolean>;
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
  expireHoldsPlacedSince(
    deadline: Date,
    trx?: GenericTransaction,
  ): Promise<number>;
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
