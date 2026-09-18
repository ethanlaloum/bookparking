import type { Knex } from 'knex';

import { placeKeyOf, RentalPlace } from '../../../domain/entities/RentalPlace';
import {
  PublishedListing,
  PublishedListingReader,
} from '../../../domain/ports/PublishedListingReader';
import {
  ACTIVE_LISTING_STATUS,
  LISTINGS_TABLE,
  SchemaPublishedListingReader,
} from './SchemaPublishedListingReader';

const toPriceInCents = (value: number | string | null): number | null => {
  if (value === null) return null;
  return typeof value === 'string' ? parseInt(value, 10) : value;
};

export class KnexPublishedListingReader implements PublishedListingReader {
  constructor(
    private readonly connection: Knex<SchemaPublishedListingReader>,
  ) {}

  public async findPublishedByPlace(
    place: RentalPlace,
  ): Promise<PublishedListing | null> {
    const row = await this.connection<SchemaPublishedListingReader>(
      LISTINGS_TABLE,
    )
      .where({ place_key: placeKeyOf(place), status: ACTIVE_LISTING_STATUS })
      .first();
    if (!row) return null;
    return KnexPublishedListingReader.toPublishedListing(row);
  }

  private static toPublishedListing(
    row: SchemaPublishedListingReader,
  ): PublishedListing {
    return {
      address: row.address,
      box: row.box,
      pricing: {
        dayInCents: toPriceInCents(row.day_price_in_cents),
        weekInCents: toPriceInCents(row.week_price_in_cents),
        monthInCents: toPriceInCents(row.month_price_in_cents),
      },
    };
  }
}
