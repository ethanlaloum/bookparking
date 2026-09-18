import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import { ConfirmedRental } from '../../../domain/entities/ConfirmedRental';
import { placeKeyOf, RentalPlace } from '../../../domain/entities/RentalPlace';
import { RentalRequest } from '../../../domain/entities/RentalRequest';
import { RentalRepository } from '../../../domain/ports/RentalRepository';
import { DatesAlreadyRentedError } from '../../../domain/usecases/request-rental/errors/DatesAlreadyRentedError';
import { ListingNotPublishedError } from '../../../domain/usecases/request-rental/errors/ListingNotPublishedError';
import {
  ACTIVE_LISTING_STATUS,
  LISTINGS_TABLE,
} from '../published-listing/SchemaPublishedListingReader';
import {
  RentalRequestStatus,
  SchemaRentalRequestRepository,
} from './SchemaRentalRequestRepository';

const EXCLUSION_VIOLATION = '23P01';
const PLACE_PERIOD_EXCLUSION_CONSTRAINT = 'rental_requests_place_period_excl';

const isPlacePeriodExclusionViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === EXCLUSION_VIOLATION &&
  (error as { constraint?: unknown }).constraint ===
    PLACE_PERIOD_EXCLUSION_CONSTRAINT;

export class KnexRentalRequestRepository implements RentalRepository {
  private readonly tableName = 'rental_requests';

  constructor(
    private readonly connection: Knex<SchemaRentalRequestRepository>,
  ) {}

  public async createRequest(
    rentalRequest: RentalRequest,
    trx?: GenericTransaction,
  ): Promise<void> {
    if (trx) {
      await this.insertOnActiveListing(rentalRequest, trx);
      return;
    }

    await this.connection.transaction(async (ownTransaction) => {
      await this.insertOnActiveListing(
        rentalRequest,
        ownTransaction as GenericTransaction,
      );
    });
  }

  public async findConfirmedByPlace(
    place: RentalPlace,
    trx?: GenericTransaction,
  ): Promise<ConfirmedRental[]> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where({
        place_key: placeKeyOf(place),
        status: RentalRequestStatus.CONFIRMED,
      })
      .orderBy('period_from', 'asc');
    if (trx) query.transacting(trx);
    const rows = await query;
    return rows.map((row) =>
      KnexRentalRequestRepository.toConfirmedRental(row, place),
    );
  }

  // The listing row is read FOR UPDATE, in the very transaction that writes the
  // request, because the read the use-case did earlier is already stale: an owner
  // unpublishing at that instant has updated the row without committing yet, and
  // a plain read still sees it ACTIVE. Locking here makes the write wait for that
  // owner, then see the withdrawal and refuse — without it, a request lands on a
  // listing nobody offers any more, and no later query can tell it apart.
  private async insertOnActiveListing(
    rentalRequest: RentalRequest,
    transaction: GenericTransaction,
  ): Promise<void> {
    const state = rentalRequest.toState();
    const placeKey = placeKeyOf({ address: state.address, box: state.box });

    const { rows } = await transaction.raw<{ rows: { id: string }[] }>(
      `SELECT id FROM ?? WHERE place_key = ? AND status = ? FOR UPDATE`,
      [LISTINGS_TABLE, placeKey, ACTIVE_LISTING_STATUS],
    );
    const activeListing = rows[0];
    if (!activeListing) throw new ListingNotPublishedError();

    try {
      await transaction<SchemaRentalRequestRepository>(this.tableName).insert({
        listing_id: activeListing.id,
        renter_id: state.renterId,
        place_key: placeKey,
        from_day: state.days.from,
        to_day: state.days.to,
        period_from: state.period.from,
        period_to: state.period.to,
        price_in_cents: state.priceInCents,
        status: RentalRequestStatus.PENDING,
        requested_at: state.requestedAt,
      });
    } catch (error: unknown) {
      if (isPlacePeriodExclusionViolation(error)) {
        throw new DatesAlreadyRentedError();
      }
      throw error;
    }
  }

  // The row stores no address and no box on purpose: copying them here would put
  // the listing's personal data behind a second door no purge of the listing
  // opens. The place handed back is the one asked for, which is faithful only
  // because the query keys on placeKeyOf(place) — the very equality
  // designatesSamePlace tests, so every row returned designates that place.
  private static toConfirmedRental(
    row: SchemaRentalRequestRepository,
    place: RentalPlace,
  ): ConfirmedRental {
    return ConfirmedRental.fromState({
      renterId: row.renter_id,
      address: place.address,
      box: place.box,
      period: {
        from: new Date(row.period_from),
        to: new Date(row.period_to),
      },
    });
  }
}
