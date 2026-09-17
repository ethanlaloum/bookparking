import { Either } from 'effect/index';

import { IncompletePricingError } from '../errors/IncompletePricingError';
import { ListingNotOwnedError } from '../errors/ListingNotOwnedError';

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
}

export interface ListingPricing {
  dayInCents: number | null;
  weekInCents: number | null;
  monthInCents: number | null;
}

export interface ListingAvailability {
  from: Date;
  to: Date;
}

export interface ListingPlace {
  address: string;
  box: string;
}

const normalizePlacePart = (part: string): string =>
  part.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();

interface Props {
  ownerId: string;
  address: string;
  box: string;
  accessDescription: string;
  photos: string[];
  pricing: ListingPricing;
  availability: ListingAvailability;
  status: ListingStatus;
  publishedAt: Date;
}

export class Listing {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): Listing {
    return new Listing(state);
  }

  public static publish(
    params: Omit<Props, 'status'>,
  ): Either.Either<Listing, IncompletePricingError> {
    if (!Listing.offersAnyDuration(params.pricing))
      return Either.left(new IncompletePricingError());
    return Either.right(
      new Listing({ ...params, status: ListingStatus.ACTIVE }),
    );
  }

  public static offersAnyDuration(pricing: ListingPricing): boolean {
    return [pricing.dayInCents, pricing.weekInCents, pricing.monthInCents].some(
      (priceInCents) => priceInCents !== null,
    );
  }

  public isOwnedBy(ownerId: string): boolean {
    return this.props.ownerId === ownerId;
  }

  public changePricing(params: {
    ownerId: string;
    pricing: ListingPricing;
  }): Either.Either<Listing, ListingNotOwnedError | IncompletePricingError> {
    const { ownerId, pricing } = params;
    if (!this.isOwnedBy(ownerId))
      return Either.left(new ListingNotOwnedError());
    if (!Listing.offersAnyDuration(pricing))
      return Either.left(new IncompletePricingError());
    return Either.right(new Listing({ ...this.props, pricing }));
  }

  public static isAvailabilityEntirelyPast(
    availability: ListingAvailability,
    at: Date,
  ): boolean {
    return availability.to.getTime() < at.getTime();
  }

  public static placeKeyOf(place: ListingPlace): string {
    return JSON.stringify([
      normalizePlacePart(place.address),
      normalizePlacePart(place.box),
    ]);
  }

  public placeKey(): string {
    return Listing.placeKeyOf({
      address: this.props.address,
      box: this.props.box,
    });
  }

  public designates(place: ListingPlace): boolean {
    return this.placeKey() === Listing.placeKeyOf(place);
  }

  public isActiveFor(place: ListingPlace): boolean {
    return this.props.status === ListingStatus.ACTIVE && this.designates(place);
  }
}
