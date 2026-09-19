import { Listing, ListingStatus } from '../../../domain/entities/Listing';
import { ListingRepository } from '../../../domain/ports/ListingRepository';
import { ActiveListingNotFoundError } from '../../../domain/usecases/update-listing-pricing/errors/ActiveListingNotFoundError';

export class InMemoryListingRepository implements ListingRepository {
  public listingList: Listing[] = [];

  public async create(listing: Listing): Promise<void> {
    this.listingList.push(listing);
  }

  public async save(listing: Listing): Promise<void> {
    const index = this.listingList.findIndex(
      (stored) =>
        stored.toState().status === ListingStatus.ACTIVE &&
        stored.placeKey() === listing.placeKey(),
    );
    if (index === -1) {
      throw new ActiveListingNotFoundError();
    }
    this.listingList[index] = listing;
  }

  public async findActiveById(listingId: string): Promise<Listing | null> {
    return (
      this.listingList.find(
        (listing) => listing.isActive() && listing.id === listingId,
      ) ?? null
    );
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
