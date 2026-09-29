import { randomUUID } from 'node:crypto';

import {
  Listing,
  ListingAvailability,
  ListingPricing,
  ListingStatus,
  VehicleType,
} from '../entities/Listing';

export class ListingBuilder {
  private state: Listing;

  constructor() {
    this.state = Listing.fromState({
      id: randomUUID(),
      ownerId: 'account-marc',
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      accessDescription:
        'portail bleu à gauche du 12, le box est au fond du premier sous-sol',
      photos: ['photo-1'],
      acceptedVehicles: [VehicleType.VOITURE, VehicleType.MOTO],
      pricing: { dayInCents: 1200, weekInCents: 6000, monthInCents: 18000 },
      availability: {
        from: new Date('2026-10-01T00:00:00.000Z'),
        to: new Date('2026-10-31T00:00:00.000Z'),
      },
      status: ListingStatus.ACTIVE,
      publishedAt: new Date('2026-09-10T00:00:00.000Z'),
    });
  }

  withId(id: string): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), id });
    return this;
  }

  withOwnerId(ownerId: string): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), ownerId });
    return this;
  }

  withAddress(address: string): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), address });
    return this;
  }

  withBox(box: string): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), box });
    return this;
  }

  withAccessDescription(accessDescription: string): ListingBuilder {
    this.state = Listing.fromState({
      ...this.state.toState(),
      accessDescription,
    });
    return this;
  }

  withPhotos(photos: string[]): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), photos });
    return this;
  }

  withPricing(pricing: ListingPricing): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), pricing });
    return this;
  }

  withAvailability(availability: ListingAvailability): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), availability });
    return this;
  }

  withStatus(status: ListingStatus): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), status });
    return this;
  }

  withPublishedAt(publishedAt: Date): ListingBuilder {
    this.state = Listing.fromState({ ...this.state.toState(), publishedAt });
    return this;
  }

  build(): Listing {
    return this.state;
  }

  withAcceptedVehicles(acceptedVehicles: VehicleType[]): ListingBuilder {
    this.state = Listing.fromState({
      ...this.state.toState(),
      acceptedVehicles,
    });
    return this;
  }
}
