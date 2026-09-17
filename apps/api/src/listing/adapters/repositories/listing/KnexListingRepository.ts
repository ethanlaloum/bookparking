import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import { Listing, ListingStatus } from '../../../domain/entities/Listing';
import { ListingRepository } from '../../../domain/ports/ListingRepository';
import { ListingAlreadyActiveError } from '../../../domain/usecases/publish-listing/errors/ListingAlreadyActiveError';
import { SchemaListingRepository } from './SchemaListingRepository';

const UNIQUE_VIOLATION = '23505';
const ACTIVE_PLACE_KEY_UNIQUE_INDEX = 'listings_active_place_key_unique';

const isActivePlaceKeyViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === UNIQUE_VIOLATION &&
  (error as { constraint?: unknown }).constraint ===
    ACTIVE_PLACE_KEY_UNIQUE_INDEX;

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
      place_key: listing.placeKey(),
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
    try {
      await query;
    } catch (error: unknown) {
      if (isActivePlaceKeyViolation(error)) {
        throw new ListingAlreadyActiveError();
      }
      throw error;
    }
  }

  public async save(listing: Listing, trx?: GenericTransaction): Promise<void> {
    const state = listing.toState();
    const query = this.connection<SchemaListingRepository>(this.tableName)
      .where({ place_key: listing.placeKey(), status: state.status })
      .update({
        day_price_in_cents: state.pricing.dayInCents,
        week_price_in_cents: state.pricing.weekInCents,
        month_price_in_cents: state.pricing.monthInCents,
      });
    if (trx) query.transacting(trx);
    await query;
  }

  public async findActiveByPlaceKey(
    placeKey: string,
    trx?: GenericTransaction,
  ): Promise<Listing | null> {
    const query = this.connection<SchemaListingRepository>(this.tableName)
      .where({ place_key: placeKey, status: ListingStatus.ACTIVE })
      .first();
    if (trx) query.transacting(trx);
    const row = await query;
    if (!row) return null;
    return Listing.fromState({
      ownerId: row.owner_id,
      address: row.address,
      box: row.box,
      accessDescription: row.access_description,
      photos: row.photos,
      pricing: {
        dayInCents: row.day_price_in_cents,
        weekInCents: row.week_price_in_cents,
        monthInCents: row.month_price_in_cents,
      },
      availability: {
        from: new Date(row.available_from),
        to: new Date(row.available_to),
      },
      status: row.status as ListingStatus,
      publishedAt: new Date(row.published_at),
    });
  }
}
