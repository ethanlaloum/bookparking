import { Either } from 'effect/index';

import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  Listing,
  ListingAvailability,
  ListingPricing,
} from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';

interface Props {
  ownerName: string;
  address: string;
  box: string;
  accessDescription: string;
  photos: string[];
  pricing: ListingPricing;
  availability: ListingAvailability;
  publishedAt: Date;
}

export class PublishListing implements UseCase<
  Props,
  Promise<Either.Either<Listing, never>>
> {
  constructor(private readonly listingRepository: ListingRepository) {}

  public async execute(props: Props): Promise<Either.Either<Listing, never>> {
    const listing = Listing.publish(props);
    await this.listingRepository.create(listing);
    return Either.right(listing);
  }
}
