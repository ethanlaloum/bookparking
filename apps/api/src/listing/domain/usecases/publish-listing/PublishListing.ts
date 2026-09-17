import { Either } from 'effect/index';

import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  Listing,
  ListingAvailability,
  ListingPricing,
} from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';
import { PhotoStorage } from '../../ports/PhotoStorage';
import { AvailabilityPeriodExpiredError } from './errors/AvailabilityPeriodExpiredError';
import { PhotoStorageFailedError } from './errors/PhotoStorageFailedError';

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
  Promise<
    Either.Either<
      Listing,
      AvailabilityPeriodExpiredError | PhotoStorageFailedError
    >
  >
> {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly photoStorage: PhotoStorage,
  ) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<
      Listing,
      AvailabilityPeriodExpiredError | PhotoStorageFailedError
    >
  > {
    if (
      Listing.isAvailabilityEntirelyPast(props.availability, props.publishedAt)
    )
      return Either.left(new AvailabilityPeriodExpiredError());

    const storage = await this.photoStorage.storeAll(props.photos);
    if (Either.isLeft(storage)) return Either.left(storage.left);

    const listing = Listing.publish(props);
    await this.listingRepository.create(listing);
    return Either.right(listing);
  }
}
