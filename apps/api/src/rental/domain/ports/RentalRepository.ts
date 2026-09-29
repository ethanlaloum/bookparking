import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { ConfirmedRental } from '../entities/ConfirmedRental';
import { RentalPlace } from '../entities/RentalPlace';
import { RentalRequest } from '../entities/RentalRequest';

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
}
