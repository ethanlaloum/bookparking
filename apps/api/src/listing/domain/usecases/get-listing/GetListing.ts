import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Listing } from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';
import { ListingNotFoundError } from './errors/ListingNotFoundError';

interface Props {
  listingId: string;
}

export class GetListing implements UseCase<
  Props,
  Promise<Either.Either<Listing, ListingNotFoundError | UnknownError>>
> {
  constructor(private readonly listingRepository: ListingRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<Listing, ListingNotFoundError | UnknownError>> {
    try {
      const activeListing = await this.listingRepository.findActiveById(
        props.listingId,
      );
      if (!activeListing) return Either.left(new ListingNotFoundError());
      return Either.right(activeListing);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
