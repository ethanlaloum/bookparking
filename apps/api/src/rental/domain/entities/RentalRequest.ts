import { Either } from 'effect/index';

import { InvalidRequestedPeriodError } from '../errors/InvalidRequestedPeriodError';
import { NoPriceForRequestedPeriodError } from '../errors/NoPriceForRequestedPeriodError';
import { RequestedPeriodTooLongError } from '../errors/RequestedPeriodTooLongError';
import {
  computeRentalPrice,
  RentalPeriod,
  RentalPricing,
} from '../services/computeRentalPrice';
import {
  CalendarDayRange,
  dayCountingPeriodOfDays,
  dayCountOfDays,
  isReadableDayRange,
  parisPeriodOfDays,
} from './CalendarDay';
import { designatesSamePlace, RentalPlace } from './RentalPlace';

export const MAX_REQUESTED_PERIOD_IN_DAYS = 366;

interface Props {
  renterId: string;
  address: string;
  box: string;
  days: CalendarDayRange;
  period: RentalPeriod;
  priceInCents: number;
  requestedAt: Date;
}

export class RentalRequest {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): RentalRequest {
    return new RentalRequest(state);
  }

  public static request(params: {
    renterId: string;
    address: string;
    box: string;
    days: CalendarDayRange;
    pricing: RentalPricing;
    requestedAt: Date;
  }): Either.Either<
    RentalRequest,
    | InvalidRequestedPeriodError
    | NoPriceForRequestedPeriodError
    | RequestedPeriodTooLongError
  > {
    if (!isReadableDayRange(params.days))
      return Either.left(new InvalidRequestedPeriodError());

    if (dayCountOfDays(params.days) > MAX_REQUESTED_PERIOD_IN_DAYS)
      return Either.left(new RequestedPeriodTooLongError());

    const price = computeRentalPrice(
      params.pricing,
      dayCountingPeriodOfDays(params.days),
    );
    if (price === null)
      return Either.left(new NoPriceForRequestedPeriodError());

    return Either.right(
      new RentalRequest({
        renterId: params.renterId,
        address: params.address,
        box: params.box,
        days: params.days,
        period: parisPeriodOfDays(params.days),
        priceInCents: price.amountInCents,
        requestedAt: params.requestedAt,
      }),
    );
  }

  public get period(): RentalPeriod {
    return this.props.period;
  }

  public designates(place: RentalPlace): boolean {
    return designatesSamePlace(
      { address: this.props.address, box: this.props.box },
      place,
    );
  }

  public overlaps(period: RentalPeriod): boolean {
    return (
      this.props.period.from.getTime() <= period.to.getTime() &&
      this.props.period.to.getTime() >= period.from.getTime()
    );
  }
}
