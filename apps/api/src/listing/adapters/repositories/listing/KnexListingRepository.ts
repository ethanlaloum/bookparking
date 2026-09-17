import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import { Listing } from '../../../domain/entities/Listing';
import { ListingRepository } from '../../../domain/ports/ListingRepository';
import { SchemaListingRepository } from './SchemaListingRepository';

export class KnexListingRepository implements ListingRepository {
  private readonly tableName = 'listings';

  constructor(private readonly connection: Knex<SchemaListingRepository>) {}

  public async create(
    listing: Listing,
    trx?: GenericTransaction,
  ): Promise<void> {
    const state = listing.toState();
    const row: Omit<
      SchemaListingRepository,
      'id' | 'created_at' | 'updated_at'
    > = {
      owner_id: state.ownerId,
      address: state.address,
      box: state.box,
      access_description: state.accessDescription,
      photos: state.photos,
      day_price_in_cents: state.pricing.dayInCents,
      week_price_in_cents: state.pricing.weekInCents,
      month_price_in_cents: state.pricing.monthInCents,
      available_from: state.availability.from,
      available_to: state.availability.to,
      status: state.status,
      published_at: state.publishedAt,
    };
    const query = this.connection(this.tableName).insert(row);
    if (trx) query.transacting(trx);
    await query;
  }
}
