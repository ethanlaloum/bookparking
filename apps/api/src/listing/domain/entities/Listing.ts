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

  public isActiveFor(place: { address: string; box: string }): boolean {
    return (
      this.props.status === ListingStatus.ACTIVE &&
      this.props.address === place.address &&
      this.props.box === place.box
    );
  }
}
