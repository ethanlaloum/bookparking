import { ConfirmedRental } from '../../../domain/entities/ConfirmedRental';
import { RentalPlace } from '../../../domain/entities/RentalPlace';
import { RentalRequest } from '../../../domain/entities/RentalRequest';
import {
  RentalRepository,
  RentalRequestSummary,
} from '../../../domain/ports/RentalRepository';

export class InMemoryRentalRepository implements RentalRepository {
  public confirmedRentalList: ConfirmedRental[] = [];
  public rentalRequestList: RentalRequest[] = [];
  public ownerIdByRequestId = new Map<string, string>();
  public confirmedRequestIds = new Set<string>();
  public expiredRequestIds = new Set<string>();
  public confirmations: { requestId: string; confirmedAt: Date }[] = [];

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
