import { randomUUID } from 'node:crypto';

import { Either } from 'effect/index';

import { IncompletePricingError } from '../errors/IncompletePricingError';
import { ListingNotOwnedError } from '../errors/ListingNotOwnedError';

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  UNPUBLISHED = 'UNPUBLISHED',
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

// Distincte de `normalizePlacePart`, et elle doit le rester : celle-ci sert la recherche
// texte d'une place et supprime les diacritiques, quand l'autre compose la `place_key`
// recopiée à l'identique dans une migration (voir apps/api/CLAUDE.md).
const normalizeForSearch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();

interface Props {
  id: string;
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
    params: Omit<Props, 'id' | 'status'>,
  ): Either.Either<Listing, IncompletePricingError> {
    if (!Listing.offersAnyDuration(params.pricing))
      return Either.left(new IncompletePricingError());
    return Either.right(
      new Listing({
        ...params,
        id: randomUUID(),
        status: ListingStatus.ACTIVE,
      }),
    );
  }

  public get id(): string {
    return this.props.id;
  }

  public isActive(): boolean {
    return this.props.status === ListingStatus.ACTIVE;
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

  public unpublish(params: {
    ownerId: string;
  }): Either.Either<Listing, ListingNotOwnedError> {
    if (!this.isOwnedBy(params.ownerId))
      return Either.left(new ListingNotOwnedError());
    return Either.right(
      new Listing({ ...this.props, status: ListingStatus.UNPUBLISHED }),
    );
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

  public addressCarries(place: string): boolean {
    return normalizeForSearch(this.props.address).includes(
      normalizeForSearch(place),
    );
  }

  public availabilityCovers(from: Date, to: Date): boolean {
    return (
      this.props.availability.from.getTime() <= from.getTime() &&
      this.props.availability.to.getTime() >= to.getTime()
    );
  }

  public isActiveFor(place: ListingPlace): boolean {
    return this.props.status === ListingStatus.ACTIVE && this.designates(place);
  }
}
