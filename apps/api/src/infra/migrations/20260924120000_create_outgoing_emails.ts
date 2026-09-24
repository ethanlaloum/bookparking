import type { Knex } from 'knex';

// SPEC-006 : la file des e-mails à envoyer. Une ligne y entre dans la
// transaction qui la motive (l'inscription), et le balayage l'en fait sortir.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('outgoing_emails', (table) => {
    table.uuid('id').primary();
    table.text('kind').notNullable();
    table
      .text('recipient')
      .notNullable()
      .comment(
        'Personal data: the address the email goes to, copied when it is queued. Erased with the account (SPEC-003).',
      );
    table.text('status').notNullable().defaultTo('PENDING');
    table.integer('attempts').notNullable().defaultTo(0);
    table.timestamp('queued_at', { useTz: true }).notNullable();
    table.timestamp('sent_at', { useTz: true }).nullable();
    table.timestamp('failed_at', { useTz: true }).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE outgoing_emails
      ADD CONSTRAINT outgoing_emails_kind_check CHECK (kind IN ('WELCOME')),
      ADD CONSTRAINT outgoing_emails_status_check CHECK (status IN ('PENDING', 'SENT', 'FAILED'));
  `);

  // Le balayage ne lit que la file : l'index ne porte que ses lignes.
  await knex.raw(`
    CREATE INDEX outgoing_emails_pending_queued_at_idx
      ON outgoing_emails (queued_at)
      WHERE status = 'PENDING';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('outgoing_emails');
}
