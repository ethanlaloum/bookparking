import { ConfirmedRental } from '../../../domain/entities/ConfirmedRental';
import { RentalPlace } from '../../../domain/entities/RentalPlace';
import { RentalRequest } from '../../../domain/entities/RentalRequest';
import { RentalRepository } from '../../../domain/ports/RentalRepository';

export class InMemoryRentalRepository implements RentalRepository {
  public confirmedRentalList: ConfirmedRental[] = [];
  public rentalRequestList: RentalRequest[] = [];

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
}
