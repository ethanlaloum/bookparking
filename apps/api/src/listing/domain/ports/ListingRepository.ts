import { Listing } from '../entities/Listing';

export interface ListingRepository {
  create(listing: Listing): Promise<void>;
}
