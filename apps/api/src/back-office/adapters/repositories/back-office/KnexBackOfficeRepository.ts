import type { Knex } from 'knex';

import { PlatformSettings } from '../../../../shared/platform-settings/domain/entities/PlatformSettings';
import {
  PLATFORM_SETTINGS_TABLE,
  toPlatformSettings,
} from '../../../../shared/platform-settings/adapters/repositories/KnexPlatformSettingsReader';
import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import {
  AdminAction,
  AdminActionKind,
  AdminTargetType,
} from '../../../domain/entities/AdminAction';
import {
  AdminAccountView,
  AdminJournalEntry,
  AdminListingView,
  AdminRentalIssueView,
  AdminRentalRequestView,
  BackOfficeRepository,
  CancelledRentalParties,
  OverviewActivity,
  OverviewAttention,
  OverviewCounts,
  IssueResolution,
  IssueToResolve,
  PlatformSettingsChange,
} from '../../../domain/ports/BackOfficeRepository';

const DAY_MS = 86_400_000;

const asNumber = (value: unknown): number => Number(value ?? 0);

interface JournalRow {
  id: string;
  acted_at: Date | string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  admin_email: string | null;
  listing_address: string | null;
  listing_box: string | null;
  account_email: string | null;
  request_address: string | null;
  request_box: string | null;
  request_from_day: string | null;
  request_to_day: string | null;
  after_fee: number | string | null;
  after_cancellation: number | null;
  after_expiry: number | null;
  after_release: number | null;
  before_fee: number | string | null;
  before_cancellation: number | null;
  before_expiry: number | null;
  before_release: number | null;
}

// « 2026-10-10 » devient « 10/10/2026 » : le journal se lit, il ne se trie pas.
const frenchDay = (day: string): string => day.split('-').reverse().join('/');

const targetLabelOf = (row: JournalRow): string | null => {
  if (row.target_type === AdminTargetType.LISTING && row.listing_address)
    return `${row.listing_address} · ${row.listing_box}`;
  if (row.target_type === AdminTargetType.ACCOUNT) return row.account_email;
  if (row.target_type === AdminTargetType.RENTAL_REQUEST && row.request_address)
    return `${row.request_address} · ${row.request_box}, du ${frenchDay(
      row.request_from_day ?? '',
    )} au ${frenchDay(row.request_to_day ?? '')}`;
  return null;
};

const settingsOf = (
  fee: number | string | null,
  cancellation: number | null,
  expiry: number | null,
  release: number | null,
): PlatformSettings | null =>
  fee === null || cancellation === null || expiry === null || release === null
    ? null
    : toPlatformSettings({
        platform_fee_percent: fee,
        free_cancellation_hours: cancellation,
        request_expiry_hours: expiry,
        payout_release_delay_hours: release,
      });

const settingsChangeOf = (
  row: JournalRow,
): AdminJournalEntry['settingsChange'] => {
  const after = settingsOf(
    row.after_fee,
    row.after_cancellation,
    row.after_expiry,
    row.after_release,
  );
  if (after === null) return null;
  return {
    before: settingsOf(
      row.before_fee,
      row.before_cancellation,
      row.before_expiry,
      row.before_release,
    ),
    after,
  };
};

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
         ) AS idle_accounts,
         (SELECT COUNT(*) FROM rental_issues WHERE status = 'OPEN') AS open_issues`,
      [new Date(now.getTime() - DAY_MS)],
    );
    if (trx) query.transacting(trx);
    const { rows } = (await query) as { rows: Record<string, unknown>[] };
    const row = rows[0] ?? {};

    return {
      requestsPendingOverADay: asNumber(row.stale_requests),
      listingsWithoutAnyPrice: asNumber(row.priceless_listings),
      accountsWithoutAnyActivity: asNumber(row.idle_accounts),
      openRentalIssues: asNumber(row.open_issues),
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
  ): Promise<CancelledRentalParties | null> {
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
      })
      .returning(['renter_id', 'listing_id']);
    if (trx) query.transacting(trx);
    const [cancelled] = (await query) as {
      renter_id: string;
      listing_id: string;
    }[];
    if (!cancelled) return null;

    const owner = this.connection('listings')
      .where({ id: cancelled.listing_id })
      .first('owner_id');
    if (trx) owner.transacting(trx);
    const listing = (await owner) as { owner_id: string } | undefined;
    return {
      renterId: cancelled.renter_id,
      ownerId: listing?.owner_id ?? '',
    };
  }

  public async findRentalIssues(
    trx?: GenericTransaction,
  ): Promise<AdminRentalIssueView[]> {
    const query = this.connection.raw(
      `SELECT i.id, i.rental_request_id, i.reason, i.message, i.reported_at,
              i.status, i.owner_reply, i.owner_replied_at, i.refund_in_cents,
              i.resolved_at, i.resolution_reason,
              l.address, l.box, r.from_day, r.to_day, r.price_in_cents,
              r.price_in_cents - COALESCE(r.platform_fee_in_cents, 0) AS owner_share,
              renter.email AS renter_email, owner.email AS owner_email
         FROM rental_issues i
         JOIN rental_requests r ON r.id = i.rental_request_id
         JOIN listings l ON l.id = r.listing_id
         LEFT JOIN accounts renter ON renter.id::text = r.renter_id
         LEFT JOIN accounts owner ON owner.id::text = l.owner_id
        ORDER BY (i.status = 'OPEN') DESC, i.reported_at DESC
        LIMIT 200`,
    );
    if (trx) query.transacting(trx);
    const { rows } = (await query) as { rows: Record<string, unknown>[] };
    const dateOrNull = (value: unknown): Date | null =>
      value === null ? null : new Date(value as string);

    return rows.map((row) => ({
      id: String(row.id),
      requestId: String(row.rental_request_id),
      reason: String(row.reason),
      message: row.message === null ? null : String(row.message),
      reportedAt: new Date(row.reported_at as string),
      status: String(row.status),
      ownerReply: row.owner_reply === null ? null : String(row.owner_reply),
      ownerRepliedAt: dateOrNull(row.owner_replied_at),
      refundInCents:
        row.refund_in_cents === null ? null : asNumber(row.refund_in_cents),
      resolvedAt: dateOrNull(row.resolved_at),
      resolutionReason:
        row.resolution_reason === null ? null : String(row.resolution_reason),
      address: String(row.address),
      box: String(row.box),
      fromDay: String(row.from_day),
      toDay: String(row.to_day),
      priceInCents: asNumber(row.price_in_cents),
      ownerShareInCents: asNumber(row.owner_share),
      renterEmail: row.renter_email === null ? null : String(row.renter_email),
      ownerEmail: row.owner_email === null ? null : String(row.owner_email),
    }));
  }

  public async findIssueToResolve(
    issueId: string,
    trx?: GenericTransaction,
  ): Promise<IssueToResolve | null> {
    const query = this.connection('rental_issues as i')
      .join('rental_requests as r', 'r.id', 'i.rental_request_id')
      .join('listings as l', 'l.id', 'r.listing_id')
      .whereRaw('i.id::text = ?', [issueId])
      .first(
        'i.id as issue_id',
        'r.id as request_id',
        'i.status as status',
        'r.price_in_cents as price_in_cents',
        'r.platform_fee_in_cents as platform_fee_in_cents',
        'r.renter_id as renter_id',
        'l.owner_id as owner_id',
      );
    if (trx) query.transacting(trx);
    const row = (await query) as Record<string, unknown> | undefined;
    if (row === undefined) return null;
    const price = asNumber(row.price_in_cents);
    return {
      issueId: String(row.issue_id),
      requestId: String(row.request_id),
      status: String(row.status),
      priceInCents: price,
      ownerShareInCents: price - asNumber(row.platform_fee_in_cents),
      renterId: String(row.renter_id),
      ownerId: String(row.owner_id),
    };
  }

  public async resolveRentalIssue(
    issueId: string,
    resolution: IssueResolution,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection('rental_issues')
      .where({ id: issueId, status: 'OPEN' })
      .update({
        status: resolution.status,
        refund_in_cents: resolution.refundInCents,
        resolved_at: resolution.resolvedAt,
        resolved_by: resolution.resolvedBy,
        resolution_reason: resolution.reason,
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

  public async savePlatformSettings(
    settings: PlatformSettings,
    change: PlatformSettingsChange,
    trx?: GenericTransaction,
  ): Promise<string> {
    const query = this.connection(PLATFORM_SETTINGS_TABLE)
      .insert({
        platform_fee_percent: settings.platformFeePercent,
        free_cancellation_hours: settings.freeCancellationHours,
        request_expiry_hours: settings.requestExpiryHours,
        payout_release_delay_hours: settings.payoutReleaseDelayHours,
        effective_from: change.at,
        changed_by: change.adminAccountId,
        reason: change.reason,
      })
      .returning('id');
    if (trx) query.transacting(trx);
    const [row] = (await query) as { id: string }[];
    return row.id;
  }

  // Une seule lecture pour tout le journal : la cible est nommée par jointure
  // selon son type — les identifiants sont des UUID, `target_id` du texte —,
  // et un changement de réglages est lu avec la version qui le précédait.
  public async findJournal(
    limit: number,
    trx?: GenericTransaction,
  ): Promise<AdminJournalEntry[]> {
    const query = this.connection.raw(
      `SELECT a.id, a.acted_at, a.action, a.target_type, a.target_id, a.reason,
              admin.email AS admin_email,
              l.address AS listing_address, l.box AS listing_box,
              acc.email AS account_email,
              rl.address AS request_address, rl.box AS request_box,
              rr.from_day AS request_from_day, rr.to_day AS request_to_day,
              v.platform_fee_percent AS after_fee,
              v.free_cancellation_hours AS after_cancellation,
              v.request_expiry_hours AS after_expiry,
              v.payout_release_delay_hours AS after_release,
              p.platform_fee_percent AS before_fee,
              p.free_cancellation_hours AS before_cancellation,
              p.request_expiry_hours AS before_expiry,
              p.payout_release_delay_hours AS before_release
         FROM admin_action_logs a
         LEFT JOIN accounts admin ON admin.id = a.admin_account_id
         LEFT JOIN listings l
           ON a.target_type = 'LISTING' AND l.id::text = a.target_id
         LEFT JOIN accounts acc
           ON a.target_type = 'ACCOUNT' AND acc.id::text = a.target_id
         LEFT JOIN rental_requests rr
           ON a.target_type = 'RENTAL_REQUEST' AND rr.id::text = a.target_id
         LEFT JOIN listings rl ON rl.id = rr.listing_id
         LEFT JOIN ${PLATFORM_SETTINGS_TABLE} v
           ON a.target_type = 'PLATFORM_SETTINGS' AND v.id::text = a.target_id
         LEFT JOIN LATERAL (
           SELECT * FROM ${PLATFORM_SETTINGS_TABLE} previous
            WHERE v.id IS NOT NULL
              AND (previous.effective_from, previous.id) < (v.effective_from, v.id)
            ORDER BY previous.effective_from DESC, previous.id DESC
            LIMIT 1
         ) p ON TRUE
        ORDER BY a.acted_at DESC, a.created_at DESC
        LIMIT ?`,
      [limit],
    );
    if (trx) query.transacting(trx);
    const { rows } = (await query) as { rows: JournalRow[] };

    return rows.map((row) => ({
      id: row.id,
      actedAt: new Date(row.acted_at),
      adminEmail: row.admin_email,
      kind: row.action as AdminActionKind,
      targetType: row.target_type as AdminTargetType,
      targetId: row.target_id,
      targetLabel: targetLabelOf(row),
      reason: row.reason,
      settingsChange: settingsChangeOf(row),
    }));
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
