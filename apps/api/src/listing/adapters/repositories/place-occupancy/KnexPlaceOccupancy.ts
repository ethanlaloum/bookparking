import type { Knex } from 'knex';

import { StayDays } from '../../../domain/entities/StayDays';
import { PlaceOccupancy } from '../../../domain/ports/PlaceOccupancy';

const RENTAL_REQUESTS_TABLE = 'rental_requests';
const RELEASING_STATUSES = [
  'EXPIRED',
  'CANCELLED',
  'ABANDONED',
  'PAYMENT_FAILED',
];
const AWAITING_PAYMENT_STATUS = 'AWAITING_PAYMENT';

const OVERLAPS_PARIS_DAYS = `tstzrange(period_from, period_to, '[]') && tstzrange(
  (?::date)::timestamp AT TIME ZONE 'Europe/Paris',
  ((?::date + 1)::timestamp AT TIME ZONE 'Europe/Paris') - interval '1 millisecond',
  '[]'
)`;

export class KnexPlaceOccupancy implements PlaceOccupancy {
  constructor(private readonly connection: Knex) {}

  public async findPlaceKeysTakenDuring(
    stay: StayDays,
    viewerId: string | null,
  ): Promise<string[]> {
    const query = this.connection(RENTAL_REQUESTS_TABLE)
      .distinct('place_key')
      .whereNotIn('status', RELEASING_STATUSES)
      .whereRaw(OVERLAPS_PARIS_DAYS, [stay.from, stay.to])
      .orderBy('place_key');
    if (viewerId !== null)
      query.whereNot((ownUnpaid) =>
        ownUnpaid.where({
          status: AWAITING_PAYMENT_STATUS,
          renter_id: viewerId,
        }),
      );
    const rows = (await query) as { place_key: string }[];
    return rows.map((row) => row.place_key);
  }
}
