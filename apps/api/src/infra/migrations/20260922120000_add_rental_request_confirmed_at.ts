import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rental_requests', (table) => {
    table
      .timestamp('confirmed_at', { useTz: true })
      .nullable()
      .comment(
        'Instant the owner confirmed the request; null while it is still PENDING.',
      );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rental_requests', (table) => {
    table.dropColumn('confirmed_at');
  });
}
