import { Either } from 'effect/index';

import { NoPriceForRequestedPeriodError } from '../errors/NoPriceForRequestedPeriodError';
import {
  computeRentalPrice,
  RentalPeriod,
  RentalPricing,
} from '../services/computeRentalPrice';
import {
  CalendarDayRange,
  dayCountingPeriodOfDays,
  parisPeriodOfDays,
} from './CalendarDay';
import { designatesSamePlace, RentalPlace } from './RentalPlace';

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
  }): Either.Either<RentalRequest, NoPriceForRequestedPeriodError> {
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
