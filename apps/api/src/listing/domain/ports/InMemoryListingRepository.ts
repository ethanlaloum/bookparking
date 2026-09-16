import { Listing } from '../entities/Listing';
import { ListingRepository } from './ListingRepository';

export class InMemoryListingRepository implements ListingRepository {
  public listingList: Listing[] = [];

  public async create(listing: Listing): Promise<void> {
    this.listingList.push(listing);
  }
}
