import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { ConfirmedRental } from '../entities/ConfirmedRental';
import { RentalPlace } from '../entities/RentalPlace';
import { RentalRequest } from '../entities/RentalRequest';

export interface RentalRepository {
  createRequest(
    rentalRequest: RentalRequest,
    trx?: GenericTransaction,
  ): Promise<void>;
  findConfirmedByPlace(
    place: RentalPlace,
    trx?: GenericTransaction,
  ): Promise<ConfirmedRental[]>;
}
