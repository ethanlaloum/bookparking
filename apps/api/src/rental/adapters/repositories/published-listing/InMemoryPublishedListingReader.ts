import {
  designatesSamePlace,
  RentalPlace,
} from '../../../domain/entities/RentalPlace';
import {
  PublishedListing,
  PublishedListingReader,
} from '../../../domain/ports/PublishedListingReader';

export class InMemoryPublishedListingReader implements PublishedListingReader {
  public publishedListingList: PublishedListing[] = [];

  public async findPublishedByPlace(
    place: RentalPlace,
  ): Promise<PublishedListing | null> {
    return (
      this.publishedListingList.find((publishedListing) =>
        designatesSamePlace(
          { address: publishedListing.address, box: publishedListing.box },
          place,
        ),
      ) ?? null
    );
  }
}
