import type { Knex } from 'knex';

const NOTIFICATION_KINDS = [
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
const EMAIL_KINDS_BEFORE = ['WELCOME', ...NOTIFICATION_KINDS];
const EMAIL_KINDS = [...EMAIL_KINDS_BEFORE, 'PASSWORD_RESET'];

const quoted = (values: string[]): string =>
  values.map((value) => `'${value}'`).join(', ');

const withEmailKinds = async (knex: Knex, kinds: string[]): Promise<void> => {
  await knex.raw(`
    ALTER TABLE outgoing_emails
      DROP CONSTRAINT outgoing_emails_kind_check,
      ADD CONSTRAINT outgoing_emails_kind_check CHECK (kind IN (${quoted(kinds)}));
  `);
};

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('password_resets', (table) => {
    table
      .text('token_hash')
      .primary()
      .comment(
        'SHA-256 of the token sent by email. The token itself is never stored in this table.',
      );
    table
      .uuid('account_id')
      .notNullable()
      .references('id')
      .inTable('accounts')
      .onDelete('CASCADE')
      .index();
    table.timestamp('requested_at', { useTz: true }).notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('spent_at', { useTz: true }).nullable();
  });

  await knex.schema.alterTable('outgoing_emails', (table) => {
    table
      .text('password_reset_token')
      .nullable()
      .comment(
        'The reset token a PASSWORD_RESET email carries, kept only until the email is sent or abandoned.',
      );
  });

  await withEmailKinds(knex, EMAIL_KINDS);

  await knex.raw(`
    ALTER TABLE outgoing_emails
      ADD CONSTRAINT outgoing_emails_password_reset_token_check CHECK (
        (kind = 'PASSWORD_RESET' OR password_reset_token IS NULL)
        AND (kind <> 'PASSWORD_RESET' OR status <> 'PENDING' OR password_reset_token IS NOT NULL)
      );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE outgoing_emails DROP CONSTRAINT IF EXISTS outgoing_emails_password_reset_token_check',
  );
  await knex('outgoing_emails').where({ kind: 'PASSWORD_RESET' }).delete();
  await withEmailKinds(knex, EMAIL_KINDS_BEFORE);
  await knex.schema.alterTable('outgoing_emails', (table) => {
    table.dropColumn('password_reset_token');
  });
  await knex.schema.dropTableIfExists('password_resets');
}
