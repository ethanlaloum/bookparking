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
];
const NOTIFICATION_KINDS = [...NOTIFICATION_KINDS_BEFORE, 'RENTAL_PAYOUT_SENT'];

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
      ADD CONSTRAINT outgoing_emails_kind_check CHECK (kind IN ('WELCOME', ${quoted(kinds)}));
  `);
};

// Le reversement au loueur (D-10, D-22 du brainstorm du 10/09) : la commission
// figée sur chaque demande, l'arrivée confirmée par le conducteur, le compte
// Stripe Connect de chaque loueur, et un virement au plus par demande.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rental_requests', (table) => {
    table.integer('platform_fee_in_cents').nullable();
    table.timestamp('arrived_at', { useTz: true }).nullable();
  });
  // Les demandes d'avant reçoivent la commission décidée le 24/09/2026 : 15 %.
  await knex.raw(
    'UPDATE rental_requests SET platform_fee_in_cents = ROUND(price_in_cents * 15 / 100.0) WHERE platform_fee_in_cents IS NULL',
  );

  await knex.schema.createTable('payout_accounts', (table) => {
    table.text('account_id').primary();
    table
      .text('stripe_account_id')
      .notNullable()
      .unique()
      .comment(
        'The Stripe Connect Express account of an owner. Identity and bank details live at Stripe, never here.',
      );
    table.boolean('payouts_enabled').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();
  });

  // Un virement au plus par demande : la clé primaire est la demande, et la
  // clé d'idempotence envoyée à Stripe aussi (`transfer-<demande>`).
  await knex.schema.createTable('owner_transfers', (table) => {
    table
      .uuid('rental_request_id')
      .primary()
      .references('id')
      .inTable('rental_requests')
      .onDelete('RESTRICT');
    table.text('owner_id').notNullable().index();
    table.integer('amount_in_cents').notNullable();
    table.text('stripe_transfer_id').notNullable().unique();
    table.timestamp('transferred_at', { useTz: true }).notNullable();
  });

  await withKinds(knex, NOTIFICATION_KINDS);
}

// Échoue tant qu'une notification ou un e-mail de versement existe, et
// `owner_transfers` part avec la trace des virements : décider de leur sort
// avant tout retour en arrière.
export async function down(knex: Knex): Promise<void> {
  await withKinds(knex, NOTIFICATION_KINDS_BEFORE);
  await knex.schema.dropTableIfExists('owner_transfers');
  await knex.schema.dropTableIfExists('payout_accounts');
  await knex.schema.alterTable('rental_requests', (table) => {
    table.dropColumn('arrived_at');
    table.dropColumn('platform_fee_in_cents');
  });
}
