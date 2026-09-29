import type { Knex } from 'knex';

const NOTIFICATION_KINDS_BEFORE = [
  'RENTAL_REQUEST_RECEIVED',
  'RENTAL_REQUEST_ACCEPTED',
  'RENTAL_REQUEST_DECLINED',
  'RENTAL_REQUEST_EXPIRED',
  'RENTAL_REQUEST_UNANSWERED',
  'RENTAL_CANCELLED_BY_RENTER',
  'RENTAL_CANCELLED_BY_OWNER',
  'RENTAL_CANCELLED_BY_OPERATOR',
  'RENTAL_PAYMENT_FAILED',
  'RENTAL_PAYOUT_SENT',
];
const NOTIFICATION_KINDS = [
  ...NOTIFICATION_KINDS_BEFORE,
  'RENTAL_ISSUE_REPORTED',
  'RENTAL_ISSUE_ANSWERED',
  'RENTAL_ISSUE_RESOLVED',
];
const emailKindsOf = (notificationKinds: string[]): string[] => [
  'WELCOME',
  ...notificationKinds,
  'PASSWORD_RESET',
];

const quoted = (values: string[]): string =>
  values.map((value) => `'${value}'`).join(', ');

const withKinds = async (knex: Knex, kinds: string[]): Promise<void> => {
  await knex.raw(`
    ALTER TABLE notifications
      DROP CONSTRAINT notifications_kind_check,
      ADD CONSTRAINT notifications_kind_check CHECK (kind IN (${quoted(kinds)}));
  `);
  await knex.raw(`
    ALTER TABLE outgoing_emails
      DROP CONSTRAINT outgoing_emails_kind_check,
      ADD CONSTRAINT outgoing_emails_kind_check CHECK (kind IN (${quoted(emailKindsOf(kinds))}));
  `);
};

// La réclamation d'un conducteur sur une réservation commencée : il ne peut
// pas entrer, ou la place est occupée. Une seule par réservation — elle gèle
// l'argent du loueur jusqu'à ce que Bookparking tranche.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('rental_issues', (table) => {
    table.uuid('id').primary();
    table
      .uuid('rental_request_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('rental_requests')
      .onDelete('CASCADE');
    table.text('reason').notNullable();
    table
      .text('message')
      .nullable()
      .comment(
        'Personal data: what the driver wrote. Erased with the account of the driver.',
      );
    table.timestamp('reported_at', { useTz: true }).notNullable();
    table.text('status').notNullable().defaultTo('OPEN');
    table
      .text('owner_reply')
      .nullable()
      .comment(
        'Personal data: what the owner answered. Erased with the account of the owner.',
      );
    table.timestamp('owner_replied_at', { useTz: true }).nullable();
    table.integer('refund_in_cents').nullable();
    table.text('refund_id').nullable();
    table.timestamp('resolved_at', { useTz: true }).nullable();
    table.uuid('resolved_by').nullable();
    table.text('resolution_reason').nullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.index(['status'], 'rental_issues_status_index');
  });

  await knex.raw(`
    ALTER TABLE rental_issues
      ADD CONSTRAINT rental_issues_reason_check
        CHECK (reason IN ('NO_ACCESS', 'PLACE_OCCUPIED', 'OTHER')),
      ADD CONSTRAINT rental_issues_status_check
        CHECK (status IN ('OPEN', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISMISSED')),
      ADD CONSTRAINT rental_issues_refund_check
        CHECK ((status IN ('REFUNDED', 'PARTIALLY_REFUNDED')) = (refund_in_cents IS NOT NULL));
  `);

  await withKinds(knex, NOTIFICATION_KINDS);
}

export async function down(knex: Knex): Promise<void> {
  await knex('notifications')
    .whereIn('kind', NOTIFICATION_KINDS.slice(NOTIFICATION_KINDS_BEFORE.length))
    .delete();
  await knex('outgoing_emails')
    .whereIn('kind', NOTIFICATION_KINDS.slice(NOTIFICATION_KINDS_BEFORE.length))
    .delete();
  await withKinds(knex, NOTIFICATION_KINDS_BEFORE);
  await knex.schema.dropTableIfExists('rental_issues');
}
