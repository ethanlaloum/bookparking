import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  Listing,
  ListingAvailability,
  ListingPricing,
  VehicleType,
} from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';
import { PhotoStorage } from '../../ports/PhotoStorage';
import { AvailabilityPeriodExpiredError } from './errors/AvailabilityPeriodExpiredError';
import { IncompletePricingError } from '../../errors/IncompletePricingError';
import { UnknownVehicleTypeError } from '../../errors/UnknownVehicleTypeError';
import { ListingAlreadyActiveError } from './errors/ListingAlreadyActiveError';
import { PhotoStorageFailedError } from './errors/PhotoStorageFailedError';

interface Props {
  ownerId: string;
  address: string;
  box: string;
  accessDescription: string;
  photos: string[];
  acceptedVehicles: VehicleType[];
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
      | IncompletePricingError
      | ListingAlreadyActiveError
      | PhotoStorageFailedError
      | UnknownVehicleTypeError
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
      | IncompletePricingError
      | ListingAlreadyActiveError
      | PhotoStorageFailedError
      | UnknownVehicleTypeError
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

      const publication = Listing.publish(props);
      if (Either.isLeft(publication)) return Either.left(publication.left);

      const activeListing = await this.listingRepository.findActiveByPlaceKey(
        Listing.placeKeyOf({ address: props.address, box: props.box }),
      );
      if (activeListing) return Either.left(new ListingAlreadyActiveError());

      const storage = await this.photoStorage.storeAll(props.photos);
      if (Either.isLeft(storage)) return Either.left(storage.left);

      await this.listingRepository.create(publication.right);
      return Either.right(publication.right);
    } catch (error: unknown) {
      if (error instanceof ListingAlreadyActiveError) return Either.left(error);
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
