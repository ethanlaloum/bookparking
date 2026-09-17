import {
  designatesSamePlace,
  RentalPlace,
} from '../../../domain/entities/RentalPlace';
import {
  PublishedListing,
  PublishedListingReader,
} from '../../../domain/ports/PublishedListingReader';

export interface StoredListing extends PublishedListing {
  published: boolean;
}

export class InMemoryPublishedListingReader implements PublishedListingReader {
  public listingList: StoredListing[] = [];

  public async findPublishedByPlace(
    place: RentalPlace,
  ): Promise<PublishedListing | null> {
    return (
      this.listingList.find(
        (listing) =>
          listing.published &&
          designatesSamePlace(
            { address: listing.address, box: listing.box },
            place,
          ),
      ) ?? null
    );
  }
}
