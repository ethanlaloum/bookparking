import { Either } from 'effect/index';

import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexRentalRequestRepository } from '../../../../rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalRequest } from '../../../../rental/domain/entities/RentalRequest';
import { ListingBuilder } from '../../../domain/builders/ListingBuilder';
import { Listing } from '../../../domain/entities/Listing';
import { StayDays } from '../../../domain/entities/StayDays';
import { KnexListingRepository } from '../listing/KnexListingRepository';
import { KnexPlaceOccupancy } from './KnexPlaceOccupancy';

type RequestStatus =
  | 'AWAITING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'ABANDONED'
  | 'PAYMENT_FAILED';

export const createKnexPlaceOccupancySUT = () => {
  const connection = getTestDbConnection();
  const listings = new KnexListingRepository(connection);
  const rentals = new KnexRentalRequestRepository(connection);
  const placeOccupancy = new KnexPlaceOccupancy(connection);

  return {
    async givenPlace(box: string): Promise<Listing> {
      const listing = new ListingBuilder()
        .withAddress('12 rue Barla, 06300 Nice')
        .withBox(box)
        .withAvailability({
          from: new Date('2026-01-01T00:00:00.000Z'),
          to: new Date('2026-12-31T00:00:00.000Z'),
        })
        .build();
      await listings.create(listing);
      return listing;
    },

    async givenRequest(params: {
      place: Listing;
      renterId: string;
      days: StayDays;
      status: RequestStatus;
    }): Promise<void> {
      const { address, box } = params.place.toState();
      const request = RentalRequest.request({
        renterId: params.renterId,
        address,
        box,
        days: params.days,
        pricing: { dayInCents: 1500, weekInCents: null, monthInCents: null },
        requestedAt: new Date('2026-09-20T07:00:00.000Z'),
      });
      if (Either.isLeft(request)) throw new Error('arrange failed');
      await rentals.createRequest(request.right);
      if (params.status !== 'AWAITING_PAYMENT')
        await connection('rental_requests')
          .where({ id: request.right.id })
          .update({ status: params.status });
    },

    async whenAskingWhichPlacesAreTaken(
      stay: StayDays,
      viewerId: string | null = null,
    ): Promise<string[]> {
      return placeOccupancy.findPlaceKeysTakenDuring(stay, viewerId);
    },
  };
};
