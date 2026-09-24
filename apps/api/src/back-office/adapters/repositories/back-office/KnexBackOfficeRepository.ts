import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import {
  AdminAction,
  AdminActionKind,
  AdminTargetType,
} from '../../../domain/entities/AdminAction';
import {
  AdminAccountView,
  AdminListingView,
  AdminRentalRequestView,
  BackOfficeRepository,
  OverviewActivity,
  OverviewAttention,
  OverviewCounts,
} from '../../../domain/ports/BackOfficeRepository';

const DAY_MS = 86_400_000;

const asNumber = (value: unknown): number => Number(value ?? 0);

/**
 * Le seul adaptateur du dépôt qui lise plusieurs tables métier à la fois : un
 * back-office regarde le système, pas un agrégat. Il copie les noms de tables
 * plutôt que d'importer une classe d'un autre contexte — même discipline que
 * `KnexPublishedListingReader`, et un renommage ne se verra qu'à l'exécution.
 */
export class KnexBackOfficeRepository implements BackOfficeRepository {
  constructor(private readonly connection: Knex) {}

  public async isAdmin(
    accountId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection('back_office_admins')
      .where({ account_id: accountId })
      .first('account_id');
    if (trx) query.transacting(trx);
    return (await query) !== undefined;
  }

  public async countsOverview(
    trx?: GenericTransaction,
  ): Promise<OverviewCounts> {
    const run = async (sql: string): Promise<Record<string, unknown>> => {
      const query = this.connection.raw(sql);
      if (trx) query.transacting(trx);
      const { rows } = (await query) as { rows: Record<string, unknown>[] };
      return rows[0] ?? {};
    };

    const accounts = await run(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE suspended_at IS NOT NULL) AS suspended
       FROM accounts`,
    );
    const listings = await run(
      `SELECT COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active,
              COUNT(*) FILTER (WHERE status = 'UNPUBLISHED') AS unpublished
       FROM listings`,
    );
    const requests = await run(
      `SELECT COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
              COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed,
              COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
              COALESCE(SUM(price_in_cents) FILTER (WHERE status = 'CONFIRMED'), 0) AS revenue
       FROM rental_requests`,
    );

    return {
      accounts: asNumber(accounts.total),
      suspendedAccounts: asNumber(accounts.suspended),
      activeListings: asNumber(listings.active),
      unpublishedListings: asNumber(listings.unpublished),
      pendingRequests: asNumber(requests.pending),
      confirmedRequests: asNumber(requests.confirmed),
      cancelledRequests: asNumber(requests.cancelled),
      confirmedRevenueInCents: asNumber(requests.revenue),
    };
  }

  public async activityOverview(
    now: Date,
    trx?: GenericTransaction,
  ): Promise<OverviewActivity> {
    const since = (days: number): Date =>
      new Date(now.getTime() - days * DAY_MS);

    const countSince = async (
      table: string,
      column: string,
      days: number,
    ): Promise<number> => {
      const query = this.connection(table)
        .where(column, '>=', since(days))
        .count<{ count: string }[]>('* as count');
      if (trx) query.transacting(trx);
      const rows = await query;
      return asNumber(rows[0]?.count);
    };

    return {
      accountsLast24h: await countSince('accounts', 'registered_at', 1),
      listingsLast24h: await countSince('listings', 'published_at', 1),
      requestsLast24h: await countSince('rental_requests', 'requested_at', 1),
      accountsLast7d: await countSince('accounts', 'registered_at', 7),
      listingsLast7d: await countSince('listings', 'published_at', 7),
      requestsLast7d: await countSince('rental_requests', 'requested_at', 7),
    };
  }

  public async attentionOverview(
    now: Date,
    trx?: GenericTransaction,
  ): Promise<OverviewAttention> {
    const query = this.connection.raw(
      `SELECT
         (SELECT COUNT(*) FROM rental_requests
           WHERE status = 'PENDING' AND requested_at < ?) AS stale_requests,
         (SELECT COUNT(*) FROM listings
           WHERE status = 'ACTIVE'
             AND day_price_in_cents IS NULL
             AND week_price_in_cents IS NULL
             AND month_price_in_cents IS NULL) AS priceless_listings,
         (SELECT COUNT(*) FROM accounts a
           WHERE NOT EXISTS (SELECT 1 FROM listings l WHERE l.owner_id = a.id::text)
             AND NOT EXISTS (SELECT 1 FROM rental_requests r WHERE r.renter_id = a.id::text)
         ) AS idle_accounts`,
      [new Date(now.getTime() - DAY_MS)],
    );
    if (trx) query.transacting(trx);
    const { rows } = (await query) as { rows: Record<string, unknown>[] };
    const row = rows[0] ?? {};

    return {
      requestsPendingOverADay: asNumber(row.stale_requests),
      listingsWithoutAnyPrice: asNumber(row.priceless_listings),
      accountsWithoutAnyActivity: asNumber(row.idle_accounts),
    };
  }

  public async findAllAccounts(
    trx?: GenericTransaction,
  ): Promise<AdminAccountView[]> {
    const query = this.connection.raw(
      `SELECT a.id, a.email, a.registered_at, a.suspended_at,
              (SELECT COUNT(*) FROM listings l WHERE l.owner_id = a.id::text) AS listing_count,
              (SELECT COUNT(*) FROM rental_requests r WHERE r.renter_id = a.id::text) AS request_count
       FROM accounts a
       ORDER BY a.registered_at DESC`,
    );
    if (trx) query.transacting(trx);
    const { rows } = (await query) as { rows: Record<string, unknown>[] };

    return rows.map((row) => ({
      id: String(row.id),
      email: String(row.email),
      registeredAt: new Date(row.registered_at as string),
      suspendedAt:
        row.suspended_at === null ? null : new Date(row.suspended_at as string),
      listingCount: asNumber(row.listing_count),
      requestCount: asNumber(row.request_count),
    }));
  }

  public async findAllListings(
    trx?: GenericTransaction,
  ): Promise<AdminListingView[]> {
    const query = this.connection.raw(
      `SELECT l.id, l.address, l.box, l.owner_id, l.status, l.accepted_vehicles,
              l.day_price_in_cents, l.week_price_in_cents, l.month_price_in_cents,
              l.published_at, a.email AS owner_email
       FROM listings l
       LEFT JOIN accounts a ON a.id::text = l.owner_id
       ORDER BY l.published_at DESC`,
    );
    if (trx) query.transacting(trx);
    const { rows } = (await query) as { rows: Record<string, unknown>[] };

    return rows.map((row) => ({
      id: String(row.id),
      address: String(row.address),
      box: String(row.box),
      ownerId: String(row.owner_id),
      // Un compte supprimé laisse une annonce orpheline : le back-office le dit
      // plutôt que de rendre une chaîne vide qu'on lirait comme un oubli.
      ownerEmail:
        row.owner_email === null
          ? 'compte introuvable'
          : String(row.owner_email),
      status: String(row.status),
      acceptedVehicles: (row.accepted_vehicles ?? []) as string[],
      dayInCents:
        row.day_price_in_cents === null
          ? null
          : asNumber(row.day_price_in_cents),
      weekInCents:
        row.week_price_in_cents === null
          ? null
          : asNumber(row.week_price_in_cents),
      monthInCents:
        row.month_price_in_cents === null
          ? null
          : asNumber(row.month_price_in_cents),
      publishedAt: new Date(row.published_at as string),
    }));
  }

  public async findAllRentalRequests(
    trx?: GenericTransaction,
  ): Promise<AdminRentalRequestView[]> {
    const query = this.connection.raw(
      `SELECT r.id, r.from_day, r.to_day, r.price_in_cents, r.status,
              r.requested_at, r.confirmed_at,
              l.address, l.box,
              owner.email AS owner_email, renter.email AS renter_email
       FROM rental_requests r
       JOIN listings l ON l.id = r.listing_id
       LEFT JOIN accounts owner ON owner.id::text = l.owner_id
       LEFT JOIN accounts renter ON renter.id::text = r.renter_id
       ORDER BY r.requested_at DESC`,
    );
    if (trx) query.transacting(trx);
    const { rows } = (await query) as { rows: Record<string, unknown>[] };

    return rows.map((row) => ({
      id: String(row.id),
      address: String(row.address),
      box: String(row.box),
      ownerEmail:
        row.owner_email === null
          ? 'compte introuvable'
          : String(row.owner_email),
      renterEmail:
        row.renter_email === null
          ? 'compte introuvable'
          : String(row.renter_email),
      fromDay: String(row.from_day),
      toDay: String(row.to_day),
      priceInCents: asNumber(row.price_in_cents),
      status: String(row.status),
      requestedAt: new Date(row.requested_at as string),
      confirmedAt:
        row.confirmed_at === null ? null : new Date(row.confirmed_at as string),
    }));
  }

  public async unpublishListing(
    listingId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    // Filtré sur ACTIVE : dépublier deux fois n'écrase pas `updated_at` et
    // rend `false`, ce que le cas d'usage traduit en « cible introuvable ».
    const query = this.connection('listings')
      .where({ id: listingId, status: 'ACTIVE' })
      .update({ status: 'UNPUBLISHED', updated_at: new Date() });
    if (trx) query.transacting(trx);
    return (await query) > 0;
  }

  public async setAccountSuspension(
    accountId: string,
    suspendedAt: Date | null,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection('accounts')
      .where({ id: accountId })
      .update({ suspended_at: suspendedAt, updated_at: new Date() });
    if (trx) query.transacting(trx);
    return (await query) > 0;
  }

  public async cancelRentalRequest(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    // Une demande déjà expirée ou annulée ne se ré-annule pas : le filtre rend
    // l'opération idempotente et libère la place par la contrainte partielle.
    // L'argent du conducteur change dans le même UPDATE que le statut : une
    // annulation ne peut pas être écrite sans la dette qu'elle fait naître
    // envers lui. C'est le balayage du contexte `rental` qui l'éteint chez
    // Stripe — levée si rien n'a été prélevé, remboursement sinon.
    const query = this.connection('rental_requests')
      .where({ id: requestId })
      .whereIn('status', ['PENDING', 'CONFIRMED'])
      .update({
        status: 'CANCELLED',
        money_status: this.connection.raw(
          "CASE money_status WHEN 'AUTHORIZED' THEN 'RELEASE_DUE' WHEN 'CAPTURED' THEN 'REFUND_DUE' ELSE money_status END",
        ),
        cancelled_at: new Date(),
        cancelled_by: 'OPERATOR',
        updated_at: new Date(),
      });
    if (trx) query.transacting(trx);
    return (await query) > 0;
  }

  public async recordAction(
    action: AdminAction,
    trx?: GenericTransaction,
  ): Promise<void> {
    const query = this.connection('admin_action_logs').insert({
      admin_account_id: action.adminAccountId,
      action: action.kind,
      target_type: action.targetType,
      target_id: action.targetId,
      reason: action.reason,
      acted_at: action.actedAt,
    });
    if (trx) query.transacting(trx);
    await query;
  }

  public async findRecentActions(
    limit: number,
    trx?: GenericTransaction,
  ): Promise<AdminAction[]> {
    const query = this.connection('admin_action_logs')
      .orderBy('acted_at', 'desc')
      .limit(limit);
    if (trx) query.transacting(trx);
    const rows = (await query) as Record<string, unknown>[];

    return rows.map((row) => ({
      adminAccountId: String(row.admin_account_id),
      kind: String(row.action) as AdminActionKind,
      targetType: String(row.target_type) as AdminTargetType,
      targetId: String(row.target_id),
      reason: row.reason === null ? null : String(row.reason),
      actedAt: new Date(row.acted_at as string),
    }));
  }
}
