import { Listing } from '../../../domain/entities/Listing';
import { ListingRepository } from '../../../domain/ports/ListingRepository';

export class InMemoryListingRepository implements ListingRepository {
  public listingList: Listing[] = [];

  public async create(listing: Listing): Promise<void> {
    this.listingList.push(listing);
  }

  public async findActiveByAddressAndBox(
    address: string,
    box: string,
  ): Promise<Listing | null> {
    return (
      this.listingList.find((listing) =>
        listing.isActiveFor({ address, box }),
      ) ?? null
    );
  }
}
