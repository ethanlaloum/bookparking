import { randomUUID } from 'node:crypto';

import { Either } from 'effect/index';

import { IncompletePricingError } from '../errors/IncompletePricingError';
import { UnknownVehicleTypeError } from '../errors/UnknownVehicleTypeError';
import { ListingNotOwnedError } from '../errors/ListingNotOwnedError';

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  UNPUBLISHED = 'UNPUBLISHED',
}

/**
 * Ce qu'une place accepte. `electrique` dit plus qu'un gabarit : il annonce une
 * borne de recharge. Mêler le gabarit et l'équipement dans une seule liste est
 * une simplification assumée — le jour où « SUV *et* borne » devra se demander,
 * il faudra deux axes, et cette énumération se scindera.
 */
export enum VehicleType {
  VELO = 'velo',
  MOTO = 'moto',
  VOITURE = 'voiture',
  ELECTRIQUE = 'electrique',
  UTILITAIRE = 'utilitaire',
}

export const isVehicleType = (value: string): value is VehicleType =>
  (Object.values(VehicleType) as string[]).includes(value);

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
  id: string;
  ownerId: string;
  address: string;
  box: string;
  accessDescription: string;
  photos: string[];
  acceptedVehicles: VehicleType[];
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
  ): Either.Either<Listing, IncompletePricingError | UnknownVehicleTypeError> {
    if (!Listing.offersAnyDuration(params.pricing))
      return Either.left(new IncompletePricingError());
    // Un tableau vide reste licite : il se lit « non déclaré », et les annonces
    // antérieures à cette notion n'ont rien à déclarer rétroactivement.
    if (params.acceptedVehicles.some((vehicle) => !isVehicleType(vehicle)))
      return Either.left(new UnknownVehicleTypeError());
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

  public accepts(vehicle: VehicleType): boolean {
    // Une place qui n'a rien déclaré n'exclut personne : l'absence d'information
    // n'est pas un refus, et la masquer ferait croire qu'elle n'existe pas.
    return (
      this.props.acceptedVehicles.length === 0 ||
      this.props.acceptedVehicles.includes(vehicle)
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

  public isActiveFor(place: ListingPlace): boolean {
    return this.props.status === ListingStatus.ACTIVE && this.designates(place);
  }
}
