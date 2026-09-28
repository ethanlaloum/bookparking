import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Listing } from '../../entities/Listing';
import { isReadableStay, StayDays } from '../../entities/StayDays';
import { ListingRepository } from '../../ports/ListingRepository';
import { PlaceOccupancy } from '../../ports/PlaceOccupancy';
import { InvalidStayError } from './errors/InvalidStayError';

interface Props {
  stay: StayDays;
  viewerId: string | null;
}

export type ListFreeListingsError = InvalidStayError | UnknownError;

export class ListFreeListings implements UseCase<
  Props,
  Promise<Either.Either<Listing[], ListFreeListingsError>>
> {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly placeOccupancy: PlaceOccupancy,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<Listing[], ListFreeListingsError>> {
    try {
      if (!isReadableStay(props.stay))
        return Either.left(new InvalidStayError());

      const listings = await this.listingRepository.findAllActive();
      const taken = new Set(
        await this.placeOccupancy.findPlaceKeysTakenDuring(
          props.stay,
          props.viewerId,
        ),
      );
      return Either.right(
        listings.filter(
          (listing) =>
            listing.isOpenOver(props.stay) && !taken.has(listing.placeKey()),
        ),
      );
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
