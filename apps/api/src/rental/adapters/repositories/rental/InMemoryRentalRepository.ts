import { ConfirmedRental } from '../../../domain/entities/ConfirmedRental';
import {
  MoneyOwed,
  MoneyState,
  RentalRequestStatus,
} from '../../../domain/entities/RentalMoney';
import { RentalPlace } from '../../../domain/entities/RentalPlace';
import { RentalRequest } from '../../../domain/entities/RentalRequest';
import { RentalPeriod } from '../../../domain/services/computeRentalPrice';
import { CancellingParty } from '../../../domain/entities/RentalCancellation';
import {
  AbandonedUnpaidRequest,
  IdempotentRentalRequest,
  RentalRepository,
  RentalRequestSummary,
  RentalRequestView,
} from '../../../domain/ports/RentalRepository';
import { DuplicateIdempotencyKeyError } from '../../../domain/usecases/request-rental/errors/DuplicateIdempotencyKeyError';

export class InMemoryRentalRepository implements RentalRepository {
  public confirmedRentalList: ConfirmedRental[] = [];
  public rentalRequestList: RentalRequest[] = [];
  public ownerIdByRequestId = new Map<string, string>();
  public confirmedRequestIds = new Set<string>();
  public expiredRequestIds = new Set<string>();
  public confirmations: { requestId: string; confirmedAt: Date }[] = [];
  // Le double n'a pas de jointure : l'adresse, le box et le propriétaire qu'un
  // vrai SELECT lirait sur `listings` sont déposés ici par le test.
  public placeByRequestId = new Map<
    string,
    { listingId: string; address: string; box: string }
  >();
  // Une demande que le test pousse directement dans `rentalRequestList`, sans
  // passer par `createRequest`, n'a pas d'entrée ici : elle se lit comme une
  // demande d'avant l'encaissement, en attente du loueur et sans paiement.
  public statusById = new Map<string, RentalRequestStatus>();
  public moneyById = new Map<string, MoneyState>();
  public paymentIdById = new Map<string, string>();
  public checkoutSessionIdById = new Map<string, string>();
  public holdPlacedAtById = new Map<string, Date>();
  public refundIdById = new Map<string, string>();
  public checkoutUrlById = new Map<string, string>();
  public idempotencyKeyById = new Map<string, string>();
  public cancellationById = new Map<
    string,
    { party: CancellingParty; cancelledAt: Date }
  >();

  public async createRequest(rentalRequest: RentalRequest): Promise<void> {
    const { renterId, idempotencyKey } = rentalRequest.toState();
    if (
      idempotencyKey &&
      this.rentalRequestList.some(
        (existing) =>
          existing.toState().renterId === renterId &&
          this.idempotencyKeyById.get(existing.id) === idempotencyKey,
      )
    )
      throw new DuplicateIdempotencyKeyError();
    if (idempotencyKey)
      this.idempotencyKeyById.set(rentalRequest.id, idempotencyKey);
    this.rentalRequestList.push(rentalRequest);
    this.statusById.set(rentalRequest.id, 'AWAITING_PAYMENT');
  }

  public placeWithoutPayment(requestId: string): void {
    this.statusById.set(requestId, 'PENDING');
  }

  public statusOf(requestId: string): RentalRequestStatus {
    if (this.confirmedRequestIds.has(requestId)) return 'CONFIRMED';
    if (this.expiredRequestIds.has(requestId)) return 'EXPIRED';
    return this.statusById.get(requestId) ?? 'PENDING';
  }

  public moneyOf(requestId: string): MoneyState {
    return this.moneyById.get(requestId) ?? 'NONE';
  }

  private setStatus(requestId: string, status: RentalRequestStatus): void {
    this.confirmedRequestIds.delete(requestId);
    this.expiredRequestIds.delete(requestId);
    if (status === 'CONFIRMED') this.confirmedRequestIds.add(requestId);
    else if (status === 'EXPIRED') this.expiredRequestIds.add(requestId);
    this.statusById.set(requestId, status);
  }

  private requestedAtOf(requestId: string): Date | undefined {
    return this.rentalRequestList
      .find((request) => request.id === requestId)
      ?.toState().requestedAt;
  }

  public async findConfirmedByPlace(
    place: RentalPlace,
  ): Promise<ConfirmedRental[]> {
    return this.confirmedRentalList.filter((rental) =>
      rental.designates(place),
    );
  }

  public async findRequestSummary(
    requestId: string,
  ): Promise<RentalRequestSummary | null> {
    const request = this.rentalRequestList.find(
      (candidate) => candidate.id === requestId,
    );
    if (!request) return null;

    const ownerId = this.ownerIdByRequestId.get(requestId);
    if (ownerId === undefined) return null;

    const status = this.statusOf(requestId);
    return {
      id: requestId,
      ownerId,
      renterId: request.toState().renterId,
      isConfirmed: status === 'CONFIRMED',
      isExpired: status === 'EXPIRED',
      status,
      money: this.moneyOf(requestId),
      paymentId: this.paymentIdById.get(requestId) ?? null,
      checkoutSessionId: this.checkoutSessionIdById.get(requestId) ?? null,
      startsAt: request.toState().period.from,
      freeCancellationUntil: request.toState().freeCancellationUntil ?? null,
    };
  }

  public async confirmRequest(
    requestId: string,
    confirmedAt: Date,
  ): Promise<void> {
    if (this.statusOf(requestId) !== 'PENDING') return;
    this.setStatus(requestId, 'CONFIRMED');
    if (this.moneyOf(requestId) === 'AUTHORIZED')
      this.moneyById.set(requestId, 'CAPTURED');
    this.confirmations.push({ requestId, confirmedAt });
  }

  public async findAllByRenter(renterId: string): Promise<RentalRequestView[]> {
    return this.views().filter((view) => view.renterId === renterId);
  }

  public async findAllForOwner(ownerId: string): Promise<RentalRequestView[]> {
    return this.views().filter((view) => view.ownerId === ownerId);
  }

  private views(): RentalRequestView[] {
    return this.rentalRequestList.map((request) => {
      const state = request.toState();
      const place = this.placeByRequestId.get(request.id);
      return {
        id: request.id,
        listingId: place?.listingId ?? '',
        address: place?.address ?? state.address,
        box: place?.box ?? state.box,
        ownerId: this.ownerIdByRequestId.get(request.id) ?? '',
        renterId: state.renterId,
        fromDay: state.days.from,
        toDay: state.days.to,
        priceInCents: state.priceInCents,
        status: this.statusOf(request.id),
        money: this.moneyOf(request.id),
        requestedAt: state.requestedAt,
        startsAt: state.period.from,
        freeCancellationUntil: state.freeCancellationUntil ?? null,
        confirmedAt:
          this.confirmations.find(
            (confirmation) => confirmation.requestId === request.id,
          )?.confirmedAt ?? null,
      };
    });
  }

  public async expireRequestsPendingSince(deadline: Date): Promise<number> {
    let expired = 0;
    for (const request of this.rentalRequestList) {
      if (this.statusOf(request.id) !== 'PENDING') continue;
      if (this.moneyOf(request.id) !== 'NONE') continue;
      if (request.toState().requestedAt.getTime() >= deadline.getTime())
        continue;
      this.setStatus(request.id, 'EXPIRED');
      expired += 1;
    }
    return expired;
  }

  public async attachPaymentPage(
    requestId: string,
    checkoutSessionId: string,
    checkoutUrl: string,
  ): Promise<void> {
    this.checkoutSessionIdById.set(requestId, checkoutSessionId);
    this.checkoutUrlById.set(requestId, checkoutUrl);
  }

  public async findByIdempotencyKey(
    renterId: string,
    idempotencyKey: string,
  ): Promise<IdempotentRentalRequest | null> {
    const found = this.rentalRequestList.find(
      (request) =>
        request.toState().renterId === renterId &&
        this.idempotencyKeyById.get(request.id) === idempotencyKey,
    );
    if (!found) return null;
    return {
      rentalRequest: found,
      checkoutUrl: this.checkoutUrlById.get(found.id) ?? null,
    };
  }

  public async forgetIdempotencyKey(requestId: string): Promise<void> {
    this.idempotencyKeyById.delete(requestId);
  }

  public async markCancelledBy(
    requestId: string,
    party: CancellingParty,
    moneyAfter: MoneyState,
    cancelledAt: Date,
  ): Promise<boolean> {
    const status = this.statusOf(requestId);
    if (status !== 'PENDING' && status !== 'CONFIRMED') return false;
    this.setStatus(requestId, 'CANCELLED');
    this.moneyById.set(requestId, moneyAfter);
    this.cancellationById.set(requestId, { party, cancelledAt });
    return true;
  }

  public async abandonOwnUnpaidRequestsOverlapping(
    renterId: string,
    place: RentalPlace,
    period: RentalPeriod,
  ): Promise<AbandonedUnpaidRequest[]> {
    const abandoned: AbandonedUnpaidRequest[] = [];
    for (const request of this.rentalRequestList) {
      if (request.toState().renterId !== renterId) continue;
      if (this.statusOf(request.id) !== 'AWAITING_PAYMENT') continue;
      if (!request.designates(place) || !request.overlaps(period)) continue;
      this.setStatus(request.id, 'ABANDONED');
      abandoned.push({
        requestId: request.id,
        checkoutSessionId: this.checkoutSessionIdById.get(request.id) ?? null,
      });
    }
    return abandoned;
  }

  public async markHoldPlaced(
    requestId: string,
    paymentId: string,
    placedAt: Date,
  ): Promise<boolean> {
    if (this.statusOf(requestId) !== 'AWAITING_PAYMENT') return false;
    this.setStatus(requestId, 'PENDING');
    this.moneyById.set(requestId, 'AUTHORIZED');
    this.paymentIdById.set(requestId, paymentId);
    this.holdPlacedAtById.set(requestId, placedAt);
    return true;
  }

  public async markAbandoned(requestId: string): Promise<boolean> {
    if (this.statusOf(requestId) !== 'AWAITING_PAYMENT') return false;
    this.setStatus(requestId, 'ABANDONED');
    return true;
  }

  public async oweReleaseOfLateHold(
    requestId: string,
    paymentId: string,
  ): Promise<boolean> {
    if (this.statusOf(requestId) !== 'ABANDONED') return false;
    if (this.moneyOf(requestId) !== 'NONE') return false;
    this.moneyById.set(requestId, 'RELEASE_DUE');
    this.paymentIdById.set(requestId, paymentId);
    return true;
  }

  public async markPaymentFailed(requestId: string): Promise<boolean> {
    if (this.statusOf(requestId) !== 'PENDING') return false;
    this.setStatus(requestId, 'PAYMENT_FAILED');
    if (this.moneyOf(requestId) === 'AUTHORIZED')
      this.moneyById.set(requestId, 'RELEASE_DUE');
    return true;
  }

  public async abandonUnpaidRequestsSince(deadline: Date): Promise<number> {
    let abandoned = 0;
    for (const request of this.rentalRequestList) {
      if (this.statusOf(request.id) !== 'AWAITING_PAYMENT') continue;
      const requestedAt = this.requestedAtOf(request.id);
      if (!requestedAt || requestedAt.getTime() > deadline.getTime()) continue;
      this.setStatus(request.id, 'ABANDONED');
      abandoned += 1;
    }
    return abandoned;
  }

  public async expireHoldsPlacedSince(deadline: Date): Promise<number> {
    let expired = 0;
    for (const request of this.rentalRequestList) {
      if (this.statusOf(request.id) !== 'PENDING') continue;
      if (this.moneyOf(request.id) !== 'AUTHORIZED') continue;
      const placedAt = this.holdPlacedAtById.get(request.id);
      if (!placedAt || placedAt.getTime() > deadline.getTime()) continue;
      this.setStatus(request.id, 'EXPIRED');
      this.moneyById.set(request.id, 'RELEASE_DUE');
      expired += 1;
    }
    return expired;
  }

  public async findMoneyOwed(): Promise<MoneyOwed[]> {
    const owed: MoneyOwed[] = [];
    for (const [requestId, money] of this.moneyById) {
      const paymentId = this.paymentIdById.get(requestId);
      if (paymentId === undefined) continue;
      if (money === 'RELEASE_DUE' || money === 'REFUND_DUE')
        owed.push({
          requestId,
          paymentId,
          owed: money,
          status: this.statusOf(requestId),
        });
    }
    return owed;
  }

  public async markReleased(requestId: string): Promise<boolean> {
    if (this.moneyOf(requestId) !== 'RELEASE_DUE') return false;
    this.moneyById.set(requestId, 'RELEASED');
    return true;
  }

  public async markRefunded(
    requestId: string,
    refundId: string,
  ): Promise<boolean> {
    if (this.moneyOf(requestId) !== 'REFUND_DUE') return false;
    this.moneyById.set(requestId, 'REFUNDED');
    this.refundIdById.set(requestId, refundId);
    return true;
  }

  public async recordMissedCapture(
    requestId: string,
    confirmedAt: Date,
  ): Promise<boolean> {
    if (this.moneyOf(requestId) !== 'RELEASE_DUE') return false;
    this.setStatus(requestId, 'CONFIRMED');
    this.moneyById.set(requestId, 'CAPTURED');
    this.confirmations.push({ requestId, confirmedAt });
    return true;
  }

  public async oweRefundOfMissedCapture(requestId: string): Promise<boolean> {
    if (this.moneyOf(requestId) !== 'RELEASE_DUE') return false;
    this.moneyById.set(requestId, 'REFUND_DUE');
    return true;
  }
}
