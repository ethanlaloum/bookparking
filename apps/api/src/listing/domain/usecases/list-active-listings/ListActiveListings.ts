import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Listing } from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';

type Props = Record<string, never>;

export class ListActiveListings implements UseCase<
  Props,
  Promise<Either.Either<Listing[], UnknownError>>
> {
  constructor(private readonly listingRepository: ListingRepository) {}

  public async execute(): Promise<Either.Either<Listing[], UnknownError>> {
    try {
      return Either.right(await this.listingRepository.findAllActive());
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
