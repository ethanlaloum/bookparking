export enum ListingStatus {
  ACTIVE = 'ACTIVE',
}

export interface ListingPricing {
  dayInCents: number;
  weekInCents: number;
  monthInCents: number;
}

export interface ListingAvailability {
  from: Date;
  to: Date;
}

export interface ListingPlace {
  address: string;
  box: string;
}

export const normalizeAddress = (address: string): string =>
  address.trim().replace(/\s+/g, ' ').toLowerCase();

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

  public static publish(params: Omit<Props, 'status'>): Listing {
    return new Listing({ ...params, status: ListingStatus.ACTIVE });
  }

  public static isAvailabilityEntirelyPast(
    availability: ListingAvailability,
    at: Date,
  ): boolean {
    return availability.to.getTime() < at.getTime();
  }

  public designates(place: ListingPlace): boolean {
    return (
      normalizeAddress(this.props.address) ===
        normalizeAddress(place.address) && this.props.box === place.box
    );
  }

  public isActiveFor(place: ListingPlace): boolean {
    return this.props.status === ListingStatus.ACTIVE && this.designates(place);
  }
}
