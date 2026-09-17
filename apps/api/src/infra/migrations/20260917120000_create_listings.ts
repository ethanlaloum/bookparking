import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('listings', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.text('owner_name').notNullable();
    table.text('address').notNullable();
    table.text('box').notNullable();
    table.text('access_description').notNullable();
    table.specificType('photos', 'text[]').notNullable();
    table.integer('day_price_in_cents').notNullable();
    table.integer('week_price_in_cents').notNullable();
    table.integer('month_price_in_cents').notNullable();
    table.timestamp('available_from', { useTz: true }).notNullable();
    table.timestamp('available_to', { useTz: true }).notNullable();
    table.text('status').notNullable();
    table.timestamp('published_at', { useTz: true }).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['address', 'box']);
  });

  await knex.raw(`
    ALTER TABLE listings
      ADD CONSTRAINT listings_status_check
        CHECK (status IN ('ACTIVE'));
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX listings_active_place_unique
      ON listings (address, box)
      WHERE status = 'ACTIVE';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS listings_active_place_unique;');
  await knex.raw(
    'ALTER TABLE IF EXISTS listings DROP CONSTRAINT IF EXISTS listings_status_check;',
  );
  await knex.schema.dropTableIfExists('listings');
}
