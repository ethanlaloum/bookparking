import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import {
  MoneyState,
  RentalRequestStatus,
} from '../../../domain/entities/RentalMoney';
import {
  RentalIssueReason,
  RentalIssueState,
  RentalIssueStatus,
} from '../../../domain/entities/RentalIssue';
import {
  IssueContext,
  IssueRefundDue,
  RentalIssueRepository,
} from '../../../domain/ports/RentalIssueRepository';

export const RENTAL_ISSUES_TABLE = 'rental_issues';

// Les colonnes d'une réclamation, lues par jointure sous le préfixe `issue_` :
// la vue des demandes et le contexte d'une réclamation les lisent de la même
// façon.
export const ISSUE_COLUMNS = (alias: string): string[] => [
  `${alias}.id as issue_id`,
  `${alias}.reason as issue_reason`,
  `${alias}.message as issue_message`,
  `${alias}.reported_at as issue_reported_at`,
  `${alias}.status as issue_status`,
  `${alias}.owner_reply as issue_owner_reply`,
  `${alias}.owner_replied_at as issue_owner_replied_at`,
  `${alias}.refund_in_cents as issue_refund_in_cents`,
  `${alias}.resolved_at as issue_resolved_at`,
];

export interface IssueRow {
  issue_id: string | null;
  issue_reason: string | null;
  issue_message: string | null;
  issue_reported_at: Date | string | null;
  issue_status: string | null;
  issue_owner_reply: string | null;
  issue_owner_replied_at: Date | string | null;
  issue_refund_in_cents: number | string | null;
  issue_resolved_at: Date | string | null;
}

const dateOrNull = (value: Date | string | null): Date | null =>
  value === null ? null : new Date(value);

export const toIssueState = (
  row: IssueRow,
  requestId: string,
): RentalIssueState | null =>
  row.issue_id === null
    ? null
    : {
        id: row.issue_id,
        requestId,
        reason: row.issue_reason as RentalIssueReason,
        message: row.issue_message,
        reportedAt: new Date(row.issue_reported_at as Date | string),
        status: row.issue_status as RentalIssueStatus,
        ownerReply: row.issue_owner_reply,
        ownerRepliedAt: dateOrNull(row.issue_owner_replied_at),
        refundInCents:
          row.issue_refund_in_cents === null
            ? null
            : Number(row.issue_refund_in_cents),
        resolvedAt: dateOrNull(row.issue_resolved_at),
      };

interface ContextRow extends IssueRow {
  id: string;
  renter_id: string;
  owner_id: string;
  status: string;
  money_status: string;
  period_from: Date | string;
  period_to: Date | string;
  arrived_at: Date | string | null;
  transferred: boolean;
}

// Le contexte `rental` lit `listings` pour le loueur et `owner_transfers` pour
// savoir si l'argent est parti : il en copie les noms, il n'importe aucune
// classe de `listing/` ni de `payout/`.
export class KnexRentalIssueRepository implements RentalIssueRepository {
  constructor(private readonly connection: Knex) {}

  public async findContext(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<IssueContext | null> {
    const query = this.connection('rental_requests as r')
      .join('listings as l', 'l.id', 'r.listing_id')
      .leftJoin('owner_transfers as t', 't.rental_request_id', 'r.id')
      .leftJoin(`${RENTAL_ISSUES_TABLE} as i`, 'i.rental_request_id', 'r.id')
      .whereRaw('r.id::text = ?', [requestId])
      .first(
        'r.id as id',
        'r.renter_id as renter_id',
        'l.owner_id as owner_id',
        'r.status as status',
        'r.money_status as money_status',
        'r.period_from as period_from',
        'r.period_to as period_to',
        'r.arrived_at as arrived_at',
        this.connection.raw('(t.rental_request_id IS NOT NULL) as transferred'),
        ...ISSUE_COLUMNS('i'),
      );
    if (trx) query.transacting(trx);
    const row = (await query) as ContextRow | undefined;
    if (row === undefined) return null;

    const issue = toIssueState(row, row.id);
    return {
      requestId: row.id,
      renterId: row.renter_id,
      ownerId: row.owner_id,
      status: row.status as RentalRequestStatus,
      money: row.money_status as MoneyState,
      startsAt: new Date(row.period_from),
      endsAt: new Date(row.period_to),
      arrivedAt: dateOrNull(row.arrived_at),
      transferred: row.transferred,
      hasIssue: issue !== null,
      issue,
    };
  }

  public async create(
    issue: RentalIssueState,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection(RENTAL_ISSUES_TABLE)
      .insert({
        id: issue.id,
        rental_request_id: issue.requestId,
        reason: issue.reason,
        message: issue.message,
        reported_at: issue.reportedAt,
        status: issue.status,
      })
      .onConflict('rental_request_id')
      .ignore()
      .returning('id');
    if (trx) query.transacting(trx);
    return (await query).length > 0;
  }

  public async recordOwnerReply(
    issueId: string,
    reply: string,
    at: Date,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection(RENTAL_ISSUES_TABLE)
      .where({ id: issueId, status: 'OPEN' })
      .whereNull('owner_reply')
      .update({ owner_reply: reply, owner_replied_at: at });
    if (trx) query.transacting(trx);
    return (await query) > 0;
  }

  public async findRefundsDue(
    trx?: GenericTransaction,
  ): Promise<IssueRefundDue[]> {
    const query = this.connection(`${RENTAL_ISSUES_TABLE} as i`)
      .join('rental_requests as r', 'r.id', 'i.rental_request_id')
      .where('i.status', 'PARTIALLY_REFUNDED')
      .whereNull('i.refund_id')
      .whereNotNull('r.payment_id')
      .orderBy('i.resolved_at', 'asc')
      .select(
        'i.id as issue_id',
        'r.id as request_id',
        'r.payment_id as payment_id',
        'i.refund_in_cents as refund_in_cents',
      );
    if (trx) query.transacting(trx);
    const rows = (await query) as {
      issue_id: string;
      request_id: string;
      payment_id: string;
      refund_in_cents: number | string;
    }[];
    return rows.map((row) => ({
      issueId: row.issue_id,
      requestId: row.request_id,
      paymentId: row.payment_id,
      amountInCents: Number(row.refund_in_cents),
    }));
  }

  public async markRefunded(
    issueId: string,
    refundId: string,
    trx?: GenericTransaction,
  ): Promise<void> {
    const query = this.connection(RENTAL_ISSUES_TABLE)
      .where({ id: issueId })
      .whereNull('refund_id')
      .update({ refund_id: refundId });
    if (trx) query.transacting(trx);
    await query;
  }
}
