import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Listing, ListingPricing } from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';
import { IncompletePricingError } from '../publish-listing/errors/IncompletePricingError';
import { ActiveListingNotFoundError } from './errors/ActiveListingNotFoundError';
import { ListingNotOwnedError } from './errors/ListingNotOwnedError';

interface Props {
  ownerId: string;
  address: string;
  box: string;
  pricing: ListingPricing;
  updatedAt: Date;
}

export class UpdateListingPricing implements UseCase<
  Props,
  Promise<
    Either.Either<
      Listing,
      | IncompletePricingError
      | ActiveListingNotFoundError
      | ListingNotOwnedError
      | UnknownError
    >
  >
> {
  constructor(private readonly listingRepository: ListingRepository) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<
      Listing,
      | IncompletePricingError
      | ActiveListingNotFoundError
      | ListingNotOwnedError
      | UnknownError
    >
  > {
    try {
      const activeListing = await this.listingRepository.findActiveByPlaceKey(
        Listing.placeKeyOf({ address: props.address, box: props.box }),
      );
      if (!activeListing) return Either.left(new ActiveListingNotFoundError());

      const repricedListing = activeListing.changePricing({
        ownerId: props.ownerId,
        pricing: props.pricing,
      });
      if (Either.isLeft(repricedListing))
        return Either.left(repricedListing.left);

      await this.listingRepository.save(repricedListing.right);
      return Either.right(repricedListing.right);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
