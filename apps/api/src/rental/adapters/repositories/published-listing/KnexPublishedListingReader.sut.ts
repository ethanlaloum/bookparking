import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { ListingStatus } from '../../../../listing/domain/entities/Listing';
import { RentalPlace } from '../../../domain/entities/RentalPlace';
import { KnexPublishedListingReader } from './KnexPublishedListingReader';

export const createKnexPublishedListingReaderSUT = () => {
  const connection = getTestDbConnection();
  const listings = new KnexListingRepository(connection);
  const reader = new KnexPublishedListingReader(connection);

  return {
    async givenListing(params: {
      place: RentalPlace;
      open: { from: string; to: string };
      status?: ListingStatus;
    }) {
      await listings.create(
        new ListingBuilder()
          .withAddress(params.place.address)
          .withBox(params.place.box)
          .withPricing({
            dayInCents: 1500,
            weekInCents: null,
            monthInCents: 25000,
          })
          .withAvailability({
            from: new Date(`${params.open.from}T00:00:00.000Z`),
            to: new Date(`${params.open.to}T00:00:00.000Z`),
          })
          .withStatus(params.status ?? ListingStatus.ACTIVE)
          .build(),
      );
    },

    async whenReading(place: RentalPlace) {
      return reader.findPublishedByPlace(place);
    },
  };
};
