import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { CalendarDay, parisPeriodOfDays } from '../../entities/CalendarDay';
import { RentalRequest } from '../../entities/RentalRequest';
import { NoPriceForRequestedPeriodError } from '../../errors/NoPriceForRequestedPeriodError';
import { PublishedListingReader } from '../../ports/PublishedListingReader';
import { RentalRepository } from '../../ports/RentalRepository';
import { DatesAlreadyRentedError } from './errors/DatesAlreadyRentedError';
import { ListingNotPublishedError } from './errors/ListingNotPublishedError';

interface Props {
  renterId: string;
  address: string;
  box: string;
  fromDay: CalendarDay;
  toDay: CalendarDay;
  requestedAt: Date;
}

export class RequestRental implements UseCase<
  Props,
  Promise<
    Either.Either<
      RentalRequest,
      | DatesAlreadyRentedError
      | ListingNotPublishedError
      | NoPriceForRequestedPeriodError
      | UnknownError
    >
  >
> {
  constructor(
    private readonly publishedListingReader: PublishedListingReader,
    private readonly rentalRepository: RentalRepository,
  ) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<
      RentalRequest,
      | DatesAlreadyRentedError
      | ListingNotPublishedError
      | NoPriceForRequestedPeriodError
      | UnknownError
    >
  > {
    try {
      const place = { address: props.address, box: props.box };

      const publishedListing =
        await this.publishedListingReader.findPublishedByPlace(place);
      if (!publishedListing) return Either.left(new ListingNotPublishedError());

      const days = { from: props.fromDay, to: props.toDay };
      const confirmedRentals =
        await this.rentalRepository.findConfirmedByPlace(place);
      if (
        confirmedRentals.some((rental) =>
          rental.overlaps(parisPeriodOfDays(days)),
        )
      )
        return Either.left(new DatesAlreadyRentedError());

      const rentalRequest = RentalRequest.request({
        renterId: props.renterId,
        address: props.address,
        box: props.box,
        days,
        pricing: publishedListing.pricing,
        requestedAt: props.requestedAt,
      });
      if (Either.isLeft(rentalRequest)) return Either.left(rentalRequest.left);

      await this.rentalRepository.createRequest(rentalRequest.right);
      return Either.right(rentalRequest.right);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
