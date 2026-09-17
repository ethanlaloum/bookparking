import { Listing, ListingStatus } from '../../../domain/entities/Listing';
import { ListingRepository } from '../../../domain/ports/ListingRepository';

export class InMemoryListingRepository implements ListingRepository {
  public listingList: Listing[] = [];

  public async create(listing: Listing): Promise<void> {
    this.listingList.push(listing);
  }

  public async findActiveByPlaceKey(placeKey: string): Promise<Listing | null> {
    return (
      this.listingList.find(
        (listing) =>
          listing.toState().status === ListingStatus.ACTIVE &&
          listing.placeKey() === placeKey,
      ) ?? null
    );
  }
}
