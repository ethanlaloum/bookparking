import { ConfirmedRental } from '../../../domain/entities/ConfirmedRental';
import { RentalPlace } from '../../../domain/entities/RentalPlace';
import { RentalRequest } from '../../../domain/entities/RentalRequest';
import {
  RentalRepository,
  RentalRequestSummary,
  RentalRequestView,
} from '../../../domain/ports/RentalRepository';

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

  public async createRequest(rentalRequest: RentalRequest): Promise<void> {
    this.rentalRequestList.push(rentalRequest);
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

    return {
      id: requestId,
      ownerId,
      renterId: request.toState().renterId,
      isConfirmed: this.confirmedRequestIds.has(requestId),
      isExpired: this.expiredRequestIds.has(requestId),
    };
  }

  public async confirmRequest(
    requestId: string,
    confirmedAt: Date,
  ): Promise<void> {
    this.confirmedRequestIds.add(requestId);
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
        status: this.confirmedRequestIds.has(request.id)
          ? 'CONFIRMED'
          : this.expiredRequestIds.has(request.id)
            ? 'EXPIRED'
            : 'PENDING',
        requestedAt: state.requestedAt,
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
      if (
        this.confirmedRequestIds.has(request.id) ||
        this.expiredRequestIds.has(request.id)
      )
        continue;
      if (request.toState().requestedAt.getTime() >= deadline.getTime())
        continue;
      this.expiredRequestIds.add(request.id);
      expired += 1;
    }
    return expired;
  }
}
