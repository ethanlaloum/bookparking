import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Listing } from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';
import { ListingNotOwnedError } from '../../errors/ListingNotOwnedError';

interface Props {
  ownerId: string;
  address: string;
  box: string;
}

export class UnpublishListing implements UseCase<
  Props,
  Promise<Either.Either<undefined, ListingNotOwnedError | UnknownError>>
> {
  constructor(private readonly listingRepository: ListingRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<undefined, ListingNotOwnedError | UnknownError>> {
    try {
      const activeListing = await this.listingRepository.findActiveByPlaceKey(
        Listing.placeKeyOf({ address: props.address, box: props.box }),
      );
      if (!activeListing) return Either.right(undefined);

      const unpublishedListing = activeListing.unpublish({
        ownerId: props.ownerId,
      });
      if (Either.isLeft(unpublishedListing))
        return Either.left(unpublishedListing.left);

      await this.listingRepository.save(unpublishedListing.right);
      return Either.right(undefined);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
