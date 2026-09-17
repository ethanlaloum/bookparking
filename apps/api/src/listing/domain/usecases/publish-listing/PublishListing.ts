import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  Listing,
  ListingAvailability,
  ListingPricing,
} from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';
import { PhotoStorage } from '../../ports/PhotoStorage';
import { AvailabilityPeriodExpiredError } from './errors/AvailabilityPeriodExpiredError';
import { ListingAlreadyActiveError } from './errors/ListingAlreadyActiveError';
import { PhotoStorageFailedError } from './errors/PhotoStorageFailedError';

interface Props {
  ownerId: string;
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
      | AvailabilityPeriodExpiredError
      | ListingAlreadyActiveError
      | PhotoStorageFailedError
      | UnknownError
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
      | AvailabilityPeriodExpiredError
      | ListingAlreadyActiveError
      | PhotoStorageFailedError
      | UnknownError
    >
  > {
    try {
      if (
        Listing.isAvailabilityEntirelyPast(
          props.availability,
          props.publishedAt,
        )
      )
        return Either.left(new AvailabilityPeriodExpiredError());

      const activeListing =
        await this.listingRepository.findActiveByAddressAndBox(
          props.address,
          props.box,
        );
      if (activeListing) return Either.left(new ListingAlreadyActiveError());

      const storage = await this.photoStorage.storeAll(props.photos);
      if (Either.isLeft(storage)) return Either.left(storage.left);

      const listing = Listing.publish(props);
      await this.listingRepository.create(listing);
      return Either.right(listing);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
