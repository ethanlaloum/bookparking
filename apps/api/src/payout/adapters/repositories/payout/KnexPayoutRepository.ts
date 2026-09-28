import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import { OwnerPayoutView } from '../../../domain/entities/OwnerPayout';
import { PayoutAccount } from '../../../domain/entities/PayoutAccount';
import {
  DuePayout,
  OwnerTransfer,
  PayoutRepository,
} from '../../../domain/ports/PayoutRepository';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

interface AccountRow {
  account_id: string;
  stripe_account_id: string;
  payouts_enabled: boolean;
}

const toAccount = (row: AccountRow): PayoutAccount => ({
  accountId: row.account_id,
  stripeAccountId: row.stripe_account_id,
  payoutsEnabled: row.payouts_enabled,
});

const orNull = (value: Date | string | null): Date | null =>
  value === null ? null : new Date(value);

// Le contexte `payout` lit `rental_requests`, `listings` et `accounts` en SQL,
// sans importer une classe de `rental/`, `listing/` ni `user-management/` —
// même discipline que `KnexPublishedListingReader`. L'argent dû au loueur est
// celui qui est prélevé (`money_status = 'CAPTURED'`) : une demande remboursée
// ou jamais prélevée n'y figure pas.
export class KnexPayoutRepository implements PayoutRepository {
  constructor(private readonly connection: Knex) {}

  public async findAccount(accountId: string): Promise<PayoutAccount | null> {
    const row = (await this.connection('payout_accounts')
      .where({ account_id: accountId })
      .first('account_id', 'stripe_account_id', 'payouts_enabled')) as
      AccountRow | undefined;
    return row === undefined ? null : toAccount(row);
  }

  public async createAccount(account: PayoutAccount, at: Date): Promise<void> {
    await this.connection('payout_accounts')
      .insert({
        account_id: account.accountId,
        stripe_account_id: account.stripeAccountId,
        payouts_enabled: account.payoutsEnabled,
        created_at: at,
        updated_at: at,
      })
      .onConflict('account_id')
      .ignore();
  }

  public async setPayoutsEnabled(
    accountId: string,
    payoutsEnabled: boolean,
    at: Date,
  ): Promise<void> {
    await this.connection('payout_accounts')
      .where({ account_id: accountId })
      .update({ payouts_enabled: payoutsEnabled, updated_at: at });
  }

  public async findEmailOf(accountId: string): Promise<string | null> {
    const row = (await this.connection('accounts')
      .whereRaw('id::text = ?', [accountId])
      .first('email')) as { email: string } | undefined;
    return row?.email ?? null;
  }

  public async findPayoutsForOwner(
    ownerId: string,
  ): Promise<OwnerPayoutView[]> {
    const rows = (await this.connection('rental_requests as r')
      .join('listings as l', 'l.id', 'r.listing_id')
      .leftJoin('owner_transfers as t', 't.rental_request_id', 'r.id')
      .where('l.owner_id', ownerId)
      .andWhere((query) =>
        query
          .where((captured) =>
            captured
              .where('r.money_status', 'CAPTURED')
              .whereNotNull('r.payment_id'),
          )
          .orWhereNotNull('t.rental_request_id'),
      )
      .select(
        'r.id as id',
        'l.address as address',
        'l.box as box',
        'r.from_day as from_day',
        'r.to_day as to_day',
        'r.price_in_cents as price_in_cents',
        'r.platform_fee_in_cents as platform_fee_in_cents',
        'r.period_from as period_from',
        'r.arrived_at as arrived_at',
        't.transferred_at as transferred_at',
        't.amount_in_cents as transferred_amount_in_cents',
      )) as {
      id: string;
      address: string;
      box: string;
      from_day: string;
      to_day: string;
      price_in_cents: number | string;
      platform_fee_in_cents: number | null;
      period_from: Date | string;
      arrived_at: Date | string | null;
      transferred_at: Date | string | null;
      transferred_amount_in_cents: number | null;
    }[];
    return rows.map((row) => ({
      requestId: row.id,
      address: row.address,
      box: row.box,
      fromDay: row.from_day,
      toDay: row.to_day,
      priceInCents: Number(row.price_in_cents),
      platformFeeInCents:
        row.platform_fee_in_cents === null
          ? null
          : Number(row.platform_fee_in_cents),
      startsAt: new Date(row.period_from),
      arrivedAt: orNull(row.arrived_at),
      transferredAt: orNull(row.transferred_at),
      transferredAmountInCents:
        row.transferred_amount_in_cents === null
          ? null
          : Number(row.transferred_amount_in_cents),
    }));
  }

  // Libérée au premier de deux événements (D-22) : l'arrivée, ou le premier
  // instant loué plus le délai. `releaseAtOf` dit la même chose en mémoire.
  public async findDuePayouts(
    now: Date,
    releaseDelayInHours: number,
    limit: number,
  ): Promise<DuePayout[]> {
    const releasedIfStartedBefore = new Date(
      now.getTime() - releaseDelayInHours * MILLISECONDS_PER_HOUR,
    );
    const rows = (await this.connection('rental_requests as r')
      .join('listings as l', 'l.id', 'r.listing_id')
      .leftJoin('payout_accounts as pa', 'pa.account_id', 'l.owner_id')
      .leftJoin('owner_transfers as t', 't.rental_request_id', 'r.id')
      .where('r.money_status', 'CAPTURED')
      .whereNotNull('r.payment_id')
      .whereNull('t.rental_request_id')
      .andWhere((released) =>
        released
          .where('r.arrived_at', '<=', now)
          .orWhere('r.period_from', '<=', releasedIfStartedBefore),
      )
      .orderBy([
        { column: 'r.period_from', order: 'asc' },
        { column: 'r.id', order: 'asc' },
      ])
      .limit(limit)
      .select(
        'r.id as id',
        'l.owner_id as owner_id',
        'r.payment_id as payment_id',
        'r.price_in_cents as price_in_cents',
        'r.platform_fee_in_cents as platform_fee_in_cents',
        'pa.account_id as account_id',
        'pa.stripe_account_id as stripe_account_id',
        'pa.payouts_enabled as payouts_enabled',
      )) as {
      id: string;
      owner_id: string;
      payment_id: string;
      price_in_cents: number | string;
      platform_fee_in_cents: number | null;
      account_id: string | null;
      stripe_account_id: string | null;
      payouts_enabled: boolean | null;
    }[];
    return rows.map((row) => ({
      requestId: row.id,
      ownerId: row.owner_id,
      paymentId: row.payment_id,
      priceInCents: Number(row.price_in_cents),
      platformFeeInCents:
        row.platform_fee_in_cents === null
          ? null
          : Number(row.platform_fee_in_cents),
      account:
        row.account_id === null || row.stripe_account_id === null
          ? null
          : toAccount({
              account_id: row.account_id,
              stripe_account_id: row.stripe_account_id,
              payouts_enabled: row.payouts_enabled === true,
            }),
    }));
  }

  // La demande est la clé : un virement enregistré deux fois ne s'écrit
  // qu'une, et garde son premier instant.
  public async recordTransfer(
    transfer: OwnerTransfer,
    trx?: GenericTransaction,
  ): Promise<void> {
    const query = this.connection('owner_transfers')
      .insert({
        rental_request_id: transfer.requestId,
        owner_id: transfer.ownerId,
        amount_in_cents: transfer.amountInCents,
        stripe_transfer_id: transfer.stripeTransferId,
        transferred_at: transfer.transferredAt,
      })
      .onConflict('rental_request_id')
      .ignore();
    if (trx) query.transacting(trx);
    await query;
  }
}
