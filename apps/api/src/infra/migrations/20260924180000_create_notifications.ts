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
];

const quoted = (values: string[]): string =>
  values.map((value) => `'${value}'`).join(', ');

// Les notifications d'une demande de location : ce que la cloche montre, et
// ce qui fait partir un e-mail. Une ligne entre dans la transaction du moment
// qui la motive (demande reçue, acceptée, annulée…), jamais après.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary();
    table.text('kind').notNullable();
    // Du texte, comme `rental_requests.renter_id` et `listings.owner_id` : les
    // comptes y sont nommés de la même façon, sans clé étrangère.
    table.text('recipient_id').notNullable();
    table
      .uuid('rental_request_id')
      .notNullable()
      .references('id')
      .inTable('rental_requests')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('read_at', { useTz: true }).nullable();
  });

  await knex.raw(`
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_kind_check CHECK (kind IN (${quoted(NOTIFICATION_KINDS)}));
  `);

  // C'est ici qu'est l'idempotence : un webhook rejoué, une confirmation
  // renvoyée ou deux balayages concurrents n'écrivent qu'une notification —
  // et donc qu'un e-mail, que l'écriture ne met en file que si elle a inséré.
  await knex.raw(`
    CREATE UNIQUE INDEX notifications_once_per_recipient_unique
      ON notifications (rental_request_id, kind, recipient_id);
  `);
  await knex.raw(`
    CREATE INDEX notifications_recipient_created_at_idx
      ON notifications (recipient_id, created_at DESC);
  `);

  await knex.raw(`
    ALTER TABLE outgoing_emails
      DROP CONSTRAINT outgoing_emails_kind_check,
      ADD CONSTRAINT outgoing_emails_kind_check
        CHECK (kind IN ('WELCOME', ${quoted(NOTIFICATION_KINDS)}));
  `);
}

// Échoue tant qu'un e-mail de notification reste dans la file : décider de son
// sort avant tout retour en arrière.
export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE outgoing_emails
      DROP CONSTRAINT outgoing_emails_kind_check,
      ADD CONSTRAINT outgoing_emails_kind_check CHECK (kind IN ('WELCOME'));
  `);
  await knex.schema.dropTableIfExists('notifications');
}
