import { Listing } from '../../../domain/entities/Listing';
import { ListingRepository } from '../../../domain/ports/ListingRepository';

export class InMemoryListingRepository implements ListingRepository {
  public listingList: Listing[] = [];

  public async create(listing: Listing): Promise<void> {
    this.listingList.push(listing);
  }
}
