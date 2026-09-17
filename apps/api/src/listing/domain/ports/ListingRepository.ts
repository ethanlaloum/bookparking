import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { Listing } from '../entities/Listing';

export interface ListingRepository {
  create(listing: Listing, trx?: GenericTransaction): Promise<void>;
}
