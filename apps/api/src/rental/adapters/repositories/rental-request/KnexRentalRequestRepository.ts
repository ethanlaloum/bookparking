import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import { ConfirmedRental } from '../../../domain/entities/ConfirmedRental';
import {
  MoneyOwed,
  MoneyState,
  RentalRequestStatus as DomainStatus,
} from '../../../domain/entities/RentalMoney';
import { placeKeyOf, RentalPlace } from '../../../domain/entities/RentalPlace';
import { RentalRequest } from '../../../domain/entities/RentalRequest';
import { CalendarDay } from '../../../domain/entities/CalendarDay';
import { CancellingParty } from '../../../domain/entities/RentalCancellation';
import { RentalPeriod } from '../../../domain/services/computeRentalPrice';
import {
  AbandonedUnpaidRequest,
  IdempotentRentalRequest,
  LapsedRentalRequest,
  RentalRepository,
  RentalRequestSummary,
  RentalRequestView,
} from '../../../domain/ports/RentalRepository';
import { DatesAlreadyRentedError } from '../../../domain/usecases/request-rental/errors/DatesAlreadyRentedError';
import { DuplicateIdempotencyKeyError } from '../../../domain/usecases/request-rental/errors/DuplicateIdempotencyKeyError';
import { ListingNotPublishedError } from '../../../domain/usecases/request-rental/errors/ListingNotPublishedError';
import {
  ACTIVE_LISTING_STATUS,
  LISTINGS_TABLE,
} from '../published-listing/SchemaPublishedListingReader';
import {
  RentalRequestStatus,
  SchemaRentalRequestRepository,
} from './SchemaRentalRequestRepository';
import {
  ISSUE_COLUMNS,
  IssueRow,
  RENTAL_ISSUES_TABLE,
  toIssueState,
} from '../rental-issue/KnexRentalIssueRepository';

interface ViewRow extends IssueRow {
  id: string;
  listing_id: string;
  renter_id: string;
  from_day: string;
  to_day: string;
  price_in_cents: number | string;
  status: string;
  money_status: string;
  requested_at: Date | string;
  confirmed_at: Date | string | null;
  period_from: Date | string;
  period_to: Date | string;
  hold_placed_at: Date | string | null;
  free_cancellation_until: Date | string | null;
  owner_id: string;
  address: string;
  box: string;
  access_description: string;
  platform_fee_in_cents: number | null;
  arrived_at: Date | string | null;
  request_expiry_hours: number | string;
  transferred: boolean;
}

interface ExpiredRow {
  id: string;
  renter_id: string;
  listing_id: string;
}

const EXCLUSION_VIOLATION = '23P01';
const PLACE_PERIOD_EXCLUSION_CONSTRAINT = 'rental_requests_place_period_excl';

const UNIQUE_VIOLATION = '23505';
const INTENT_UNIQUE_INDEX = 'rental_requests_renter_idempotency_key_unique';

const isIntentUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === UNIQUE_VIOLATION &&
  (error as { constraint?: unknown }).constraint === INTENT_UNIQUE_INDEX;

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
        id: state.id,
        listing_id: activeListing.id,
        renter_id: state.renterId,
        place_key: placeKey,
        from_day: state.days.from,
        to_day: state.days.to,
        period_from: state.period.from,
        period_to: state.period.to,
        price_in_cents: state.priceInCents,
        status: RentalRequestStatus.AWAITING_PAYMENT,
        requested_at: state.requestedAt,
        idempotency_key: state.idempotencyKey ?? null,
        free_cancellation_until: state.freeCancellationUntil ?? null,
        platform_fee_in_cents: state.platformFeeInCents ?? null,
        // Absents, la base applique ses défauts : seules les fixtures des
        // tests écrivent une demande sans les délais du back-office.
        ...(state.requestExpiryHours == null
          ? {}
          : { request_expiry_hours: state.requestExpiryHours }),
        ...(state.payoutReleaseDelayHours == null
          ? {}
          : { payout_release_delay_hours: state.payoutReleaseDelayHours }),
      });
    } catch (error: unknown) {
      if (isIntentUniqueViolation(error))
        throw new DuplicateIdempotencyKeyError();
      if (isPlacePeriodExclusionViolation(error)) {
        throw new DatesAlreadyRentedError();
      }
      throw error;
    }
  }

  // The owner is read by joining listings: the rental context reads that table
  // — it copies its name, it never imports a class from listing/. A request
  // whose listing row is gone reads as no request at all, which is what the
  // ON DELETE CASCADE already makes true.
  public async findRequestSummary(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<RentalRequestSummary | null> {
    const query = this.connection(this.tableName)
      .join(
        LISTINGS_TABLE,
        `${this.tableName}.listing_id`,
        `${LISTINGS_TABLE}.id`,
      )
      .where(`${this.tableName}.id`, requestId)
      .first(
        `${this.tableName}.id as id`,
        `${this.tableName}.renter_id as renter_id`,
        `${this.tableName}.status as status`,
        `${this.tableName}.money_status as money_status`,
        `${this.tableName}.payment_id as payment_id`,
        `${this.tableName}.checkout_session_id as checkout_session_id`,
        `${this.tableName}.period_from as period_from`,
        `${this.tableName}.free_cancellation_until as free_cancellation_until`,
        `${LISTINGS_TABLE}.owner_id as owner_id`,
      );
    if (trx) query.transacting(trx);

    const row = (await query) as
      | {
          id: string;
          renter_id: string;
          status: string;
          money_status: string;
          payment_id: string | null;
          checkout_session_id: string | null;
          period_from: Date | string;
          free_cancellation_until: Date | string | null;
          owner_id: string;
        }
      | undefined;
    if (!row) return null;

    return {
      id: row.id,
      ownerId: row.owner_id,
      renterId: row.renter_id,
      isConfirmed: row.status === RentalRequestStatus.CONFIRMED,
      isExpired: row.status === RentalRequestStatus.EXPIRED,
      status: row.status as DomainStatus,
      money: row.money_status as MoneyState,
      paymentId: row.payment_id,
      checkoutSessionId: row.checkout_session_id,
      startsAt: new Date(row.period_from),
      freeCancellationUntil:
        row.free_cancellation_until === null
          ? null
          : new Date(row.free_cancellation_until),
    };
  }

  // The update keys on status = PENDING, so two confirmations racing on the
  // same request write once: the second matches no row. The use-case already
  // returns early on an isConfirmed summary, but that read is stale by the time
  // this runs, and only this filter makes the write itself idempotent.
  public async confirmRequest(
    requestId: string,
    confirmedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where({ id: requestId, status: RentalRequestStatus.PENDING })
      .update({
        status: RentalRequestStatus.CONFIRMED,
        confirmed_at: confirmedAt,
        money_status: this.connection.raw(
          "CASE WHEN money_status = 'AUTHORIZED' THEN 'CAPTURED' ELSE money_status END",
        ) as unknown as string,
        updated_at: new Date(),
      });
    if (trx) query.transacting(trx);
    return (await query) > 0;
  }

  // Only PENDING rows expire: a confirmed rental is a booking, and re-expiring
  // an already expired row would keep rewriting updated_at for nothing. The
  // partial exclusion constraint added in 20260922130000 is what makes this
  // status change actually free the place — without it the row would still
  // collide with every overlapping request. Each row lapses on the delay
  // frozen on it, never on today's setting.
  public async expireLapsedPendingRequests(
    now: Date,
    trx?: GenericTransaction,
  ): Promise<LapsedRentalRequest[]> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where('status', RentalRequestStatus.PENDING)
      .andWhere('money_status', 'NONE')
      .andWhereRaw(
        "requested_at + request_expiry_hours * interval '1 hour' < ?",
        [now],
      )
      .update({
        status: RentalRequestStatus.EXPIRED,
        updated_at: new Date(),
      })
      .returning(['id', 'renter_id', 'listing_id']);
    if (trx) query.transacting(trx);
    return this.withOwners((await query) as ExpiredRow[], trx);
  }

  // `RETURNING` ne rend que les colonnes de la demande : le loueur est lu sur
  // `listings`, dans la même transaction, pour chaque annonce touchée.
  private async withOwners(
    rows: ExpiredRow[],
    trx?: GenericTransaction,
  ): Promise<LapsedRentalRequest[]> {
    if (rows.length === 0) return [];
    const query = this.connection(LISTINGS_TABLE)
      .whereIn(
        'id',
        rows.map((row) => row.listing_id),
      )
      .select('id', 'owner_id');
    if (trx) query.transacting(trx);
    const owners = new Map(
      ((await query) as { id: string; owner_id: string }[]).map((listing) => [
        listing.id,
        listing.owner_id,
      ]),
    );
    return rows.map((row) => ({
      requestId: row.id,
      renterId: row.renter_id,
      ownerId: owners.get(row.listing_id) ?? '',
    }));
  }

  public async findAllByRenter(
    renterId: string,
    trx?: GenericTransaction,
  ): Promise<RentalRequestView[]> {
    return this.findViews(`${this.tableName}.renter_id`, renterId, trx);
  }

  public async findAllForOwner(
    ownerId: string,
    trx?: GenericTransaction,
  ): Promise<RentalRequestView[]> {
    return this.findViews(`${LISTINGS_TABLE}.owner_id`, ownerId, trx);
  }

  // La jointure porte l'adresse et le box, que la demande ne stocke pas. Elle
  // vise `listings` sans filtrer sur son statut : une demande sur une place
  // depuis dépubliée reste une demande, et la masquer priverait le propriétaire
  // de l'historique qui justifie ses revenus.
  private async findViews(
    column: string,
    value: string,
    trx?: GenericTransaction,
  ): Promise<RentalRequestView[]> {
    const query = this.connection(this.tableName)
      .join(
        LISTINGS_TABLE,
        `${this.tableName}.listing_id`,
        `${LISTINGS_TABLE}.id`,
      )
      .leftJoin(
        `${RENTAL_ISSUES_TABLE} as issue`,
        'issue.rental_request_id',
        `${this.tableName}.id`,
      )
      .leftJoin(
        'owner_transfers as transfer',
        'transfer.rental_request_id',
        `${this.tableName}.id`,
      )
      .where(column, value)
      .orderBy(`${this.tableName}.requested_at`, 'desc')
      .select(
        `${this.tableName}.id as id`,
        `${this.tableName}.listing_id as listing_id`,
        `${this.tableName}.renter_id as renter_id`,
        `${this.tableName}.from_day as from_day`,
        `${this.tableName}.to_day as to_day`,
        `${this.tableName}.price_in_cents as price_in_cents`,
        `${this.tableName}.status as status`,
        `${this.tableName}.money_status as money_status`,
        `${this.tableName}.requested_at as requested_at`,
        `${this.tableName}.confirmed_at as confirmed_at`,
        `${this.tableName}.period_from as period_from`,
        `${this.tableName}.period_to as period_to`,
        `${this.tableName}.hold_placed_at as hold_placed_at`,
        `${this.tableName}.free_cancellation_until as free_cancellation_until`,
        `${LISTINGS_TABLE}.owner_id as owner_id`,
        `${LISTINGS_TABLE}.address as address`,
        `${LISTINGS_TABLE}.box as box`,
        `${LISTINGS_TABLE}.access_description as access_description`,
        `${this.tableName}.platform_fee_in_cents as platform_fee_in_cents`,
        `${this.tableName}.arrived_at as arrived_at`,
        `${this.tableName}.request_expiry_hours as request_expiry_hours`,
        this.connection.raw(
          '(transfer.rental_request_id IS NOT NULL) as transferred',
        ),
        ...ISSUE_COLUMNS('issue'),
      );
    if (trx) query.transacting(trx);

    const rows = (await query) as ViewRow[];
    return rows.map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      address: row.address,
      box: row.box,
      ownerId: row.owner_id,
      renterId: row.renter_id,
      fromDay: row.from_day,
      toDay: row.to_day,
      priceInCents: Number(row.price_in_cents),
      status: row.status as DomainStatus,
      money: row.money_status as MoneyState,
      requestedAt: new Date(row.requested_at),
      confirmedAt:
        row.confirmed_at === null ? null : new Date(row.confirmed_at),
      startsAt: new Date(row.period_from),
      endsAt: new Date(row.period_to),
      holdPlacedAt:
        row.hold_placed_at === null ? null : new Date(row.hold_placed_at),
      freeCancellationUntil:
        row.free_cancellation_until === null
          ? null
          : new Date(row.free_cancellation_until),
      accessInstructions: row.access_description,
      platformFeeInCents:
        row.platform_fee_in_cents === null
          ? null
          : Number(row.platform_fee_in_cents),
      arrivedAt: row.arrived_at === null ? null : new Date(row.arrived_at),
      requestExpiryHours: Number(row.request_expiry_hours),
      transferred: row.transferred,
      issue: toIssueState(row, row.id),
    }));
  }

  public async attachPaymentPage(
    requestId: string,
    checkoutSessionId: string,
    checkoutUrl: string,
    trx?: GenericTransaction,
  ): Promise<void> {
    await this.transition(
      trx,
      { id: requestId },
      { checkout_session_id: checkoutSessionId, checkout_url: checkoutUrl },
    );
  }

  // L'adresse et le box sont relus sur `listings`, comme partout : la demande
  // n'en garde qu'une clé. Ils servent à reconnaître qu'une intention rejouée
  // vise bien la même place.
  public async findByIdempotencyKey(
    renterId: string,
    idempotencyKey: string,
    trx?: GenericTransaction,
  ): Promise<IdempotentRentalRequest | null> {
    const query = this.connection(this.tableName)
      .join(
        LISTINGS_TABLE,
        `${this.tableName}.listing_id`,
        `${LISTINGS_TABLE}.id`,
      )
      .where({
        [`${this.tableName}.renter_id`]: renterId,
        [`${this.tableName}.idempotency_key`]: idempotencyKey,
      })
      .first(
        `${this.tableName}.*`,
        `${LISTINGS_TABLE}.address as address`,
        `${LISTINGS_TABLE}.box as box`,
      );
    if (trx) query.transacting(trx);
    const row = (await query) as
      | (SchemaRentalRequestRepository & { address: string; box: string })
      | undefined;
    if (!row) return null;

    return {
      rentalRequest: RentalRequest.fromState({
        id: row.id,
        renterId: row.renter_id,
        address: row.address,
        box: row.box,
        days: {
          from: row.from_day as CalendarDay,
          to: row.to_day as CalendarDay,
        },
        period: {
          from: new Date(row.period_from),
          to: new Date(row.period_to),
        },
        priceInCents: Number(row.price_in_cents),
        requestedAt: new Date(row.requested_at),
        idempotencyKey: row.idempotency_key,
        freeCancellationUntil:
          row.free_cancellation_until === null
            ? null
            : new Date(row.free_cancellation_until),
      }),
      checkoutUrl: row.checkout_url,
    };
  }

  // Le statut, l'argent dû et l'auteur changent dans le même UPDATE, filtré
  // sur les deux statuts qu'une annulation quitte : une seconde annulation ne
  // trouve plus rien, et la dette envers le conducteur ne naît qu'une fois.
  public async markCancelledBy(
    requestId: string,
    party: CancellingParty,
    moneyAfter: MoneyState,
    cancelledAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where('id', requestId)
      .whereIn('status', [
        RentalRequestStatus.PENDING,
        RentalRequestStatus.CONFIRMED,
      ])
      .update({
        status: RentalRequestStatus.CANCELLED,
        money_status: moneyAfter,
        cancelled_at: cancelledAt,
        cancelled_by: party,
        updated_at: new Date(),
      });
    if (trx) query.transacting(trx);
    return (await query) > 0;
  }

  // Le chevauchement est jugé comme la contrainte d'exclusion le juge, sur
  // `tstzrange(period_from, period_to, '[]')` : une demande que cette écriture
  // ne libérerait pas bloquerait encore l'insertion qui suit.
  public async abandonOwnUnpaidRequestsOverlapping(
    renterId: string,
    place: RentalPlace,
    period: RentalPeriod,
    trx?: GenericTransaction,
  ): Promise<AbandonedUnpaidRequest[]> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where({
        renter_id: renterId,
        place_key: placeKeyOf(place),
        status: RentalRequestStatus.AWAITING_PAYMENT,
      })
      .whereRaw(
        "tstzrange(period_from, period_to, '[]') && tstzrange(?, ?, '[]')",
        [period.from, period.to],
      )
      .update({ status: RentalRequestStatus.ABANDONED, updated_at: new Date() })
      .returning(['id', 'checkout_session_id']);
    if (trx) query.transacting(trx);
    const rows = (await query) as {
      id: string;
      checkout_session_id: string | null;
    }[];
    return rows.map((row) => ({
      requestId: row.id,
      checkoutSessionId: row.checkout_session_id,
    }));
  }

  public async forgetIdempotencyKey(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<void> {
    await this.transition(trx, { id: requestId }, { idempotency_key: null });
  }

  public async markHoldPlaced(
    requestId: string,
    paymentId: string,
    placedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    return (
      (await this.transition(
        trx,
        { id: requestId, status: RentalRequestStatus.AWAITING_PAYMENT },
        {
          status: RentalRequestStatus.PENDING,
          money_status: 'AUTHORIZED',
          payment_id: paymentId,
          hold_placed_at: placedAt,
        },
      )) > 0
    );
  }

  public async markArrived(
    requestId: string,
    arrivedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where({ id: requestId, status: RentalRequestStatus.CONFIRMED })
      .whereNull('arrived_at')
      .update({ arrived_at: arrivedAt, updated_at: new Date() });
    if (trx) query.transacting(trx);
    return (await query) > 0;
  }

  public async markAbandoned(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    return (
      (await this.transition(
        trx,
        { id: requestId, status: RentalRequestStatus.AWAITING_PAYMENT },
        { status: RentalRequestStatus.ABANDONED },
      )) > 0
    );
  }

  public async oweReleaseOfLateHold(
    requestId: string,
    paymentId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    return (
      (await this.transition(
        trx,
        {
          id: requestId,
          status: RentalRequestStatus.ABANDONED,
          money_status: 'NONE',
        },
        { money_status: 'RELEASE_DUE', payment_id: paymentId },
      )) > 0
    );
  }

  public async markPaymentFailed(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    return (
      (await this.transition(
        trx,
        {
          id: requestId,
          status: RentalRequestStatus.PENDING,
          money_status: 'AUTHORIZED',
        },
        {
          status: RentalRequestStatus.PAYMENT_FAILED,
          money_status: 'RELEASE_DUE',
        },
      )) > 0
    );
  }

  public async abandonUnpaidRequestsSince(
    deadline: Date,
    trx?: GenericTransaction,
  ): Promise<number> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where('status', RentalRequestStatus.AWAITING_PAYMENT)
      .andWhere('requested_at', '<=', deadline)
      .update({
        status: RentalRequestStatus.ABANDONED,
        updated_at: new Date(),
      });
    if (trx) query.transacting(trx);
    return await query;
  }

  // Le statut et la dette envers le conducteur changent dans le même UPDATE :
  // aucune lecture, pas même celle d'un balayage concurrent, ne peut trouver
  // une demande expirée dont l'empreinte ne serait pas marquée à lever.
  public async expireLapsedHolds(
    now: Date,
    trx?: GenericTransaction,
  ): Promise<LapsedRentalRequest[]> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where('status', RentalRequestStatus.PENDING)
      .andWhere('money_status', 'AUTHORIZED')
      .andWhereRaw(
        "hold_placed_at + request_expiry_hours * interval '1 hour' <= ?",
        [now],
      )
      .update({
        status: RentalRequestStatus.EXPIRED,
        money_status: 'RELEASE_DUE',
        updated_at: new Date(),
      })
      .returning(['id', 'renter_id', 'listing_id']);
    if (trx) query.transacting(trx);
    return this.withOwners((await query) as ExpiredRow[], trx);
  }

  public async findMoneyOwed(trx?: GenericTransaction): Promise<MoneyOwed[]> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .whereIn('money_status', ['RELEASE_DUE', 'REFUND_DUE'])
      .whereNotNull('payment_id')
      .orderBy('updated_at', 'asc')
      .select('id', 'payment_id', 'money_status', 'status');
    if (trx) query.transacting(trx);
    const rows = await query;
    return rows.map((row) => ({
      requestId: row.id,
      paymentId: row.payment_id as string,
      owed: row.money_status as MoneyOwed['owed'],
      status: row.status as DomainStatus,
    }));
  }

  public async markReleased(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    return (
      (await this.transition(
        trx,
        { id: requestId, money_status: 'RELEASE_DUE' },
        { money_status: 'RELEASED' },
      )) > 0
    );
  }

  public async markRefunded(
    requestId: string,
    refundId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    return (
      (await this.transition(
        trx,
        { id: requestId, money_status: 'REFUND_DUE' },
        { money_status: 'REFUNDED', refund_id: refundId },
      )) > 0
    );
  }

  public async recordMissedCapture(
    requestId: string,
    confirmedAt: Date,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    return (
      (await this.transition(
        trx,
        { id: requestId, money_status: 'RELEASE_DUE' },
        {
          status: RentalRequestStatus.CONFIRMED,
          money_status: 'CAPTURED',
          confirmed_at: confirmedAt,
        },
      )) > 0
    );
  }

  public async oweRefundOfMissedCapture(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    return (
      (await this.transition(
        trx,
        { id: requestId, money_status: 'RELEASE_DUE' },
        { money_status: 'REFUND_DUE' },
      )) > 0
    );
  }

  private async transition(
    trx: GenericTransaction | undefined,
    from: Partial<SchemaRentalRequestRepository>,
    to: Partial<SchemaRentalRequestRepository>,
  ): Promise<number> {
    const query = this.connection<SchemaRentalRequestRepository>(this.tableName)
      .where(from)
      .update({ ...to, updated_at: new Date() });
    if (trx) query.transacting(trx);
    return await query;
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
