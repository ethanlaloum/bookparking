import { randomUUID } from 'node:crypto';

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

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

// L'échéance se compte en heures depuis le premier instant de la location,
// heure de Paris — jamais en jours locaux : c'est elle qui est figée sur la
// demande, et un délai modifié plus tard ne la déplace pas.
const freeCancellationUntilOf = (
  period: RentalPeriod,
  freeCancellationHours: number | undefined,
): Date | null =>
  freeCancellationHours === undefined
    ? null
    : new Date(
        period.from.getTime() - freeCancellationHours * MILLISECONDS_PER_HOUR,
      );

interface Props {
  id: string;
  renterId: string;
  address: string;
  box: string;
  days: CalendarDayRange;
  period: RentalPeriod;
  priceInCents: number;
  requestedAt: Date;
  idempotencyKey?: string | null;
  freeCancellationUntil?: Date | null;
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
    idempotencyKey?: string | null;
    freeCancellationHours?: number;
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
        // L'identifiant naît ici, jamais du défaut de la colonne : une demande
        // doit pouvoir être nommée — et confirmée — sans relire la ligne
        // écrite. Même discipline que Listing.publish().
        id: randomUUID(),
        renterId: params.renterId,
        address: params.address,
        box: params.box,
        days: params.days,
        period: parisPeriodOfDays(params.days),
        priceInCents: price.amountInCents,
        requestedAt: params.requestedAt,
        idempotencyKey: params.idempotencyKey ?? null,
        freeCancellationUntil: freeCancellationUntilOf(
          parisPeriodOfDays(params.days),
          params.freeCancellationHours,
        ),
      }),
    );
  }

  public get id(): string {
    return this.props.id;
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
