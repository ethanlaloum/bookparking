import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS btree_gist;');

  await knex.schema.createTable('rental_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table
      .uuid('listing_id')
      .notNullable()
      .references('id')
      .inTable('listings')
      .onDelete('CASCADE')
      .index();
    table.text('renter_id').notNullable();
    table.text('address').notNullable();
    table.text('box').notNullable();
    table
      .text('place_key')
      .notNullable()
      .comment(
        'Normalized [address, box] pair produced by RentalPlace.placeKeyOf, the key two requests must share to collide.',
      );
    table.text('from_day').notNullable().comment('Europe/Paris calendar day.');
    table.text('to_day').notNullable().comment('Europe/Paris calendar day.');
    table
      .timestamp('period_from', { useTz: true })
      .notNullable()
      .comment('First instant of from_day in Europe/Paris.');
    table
      .timestamp('period_to', { useTz: true })
      .notNullable()
      .comment('Last instant of to_day in Europe/Paris, bound included.');
    table.integer('price_in_cents').notNullable();
    table.text('status').notNullable();
    table.timestamp('requested_at', { useTz: true }).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['place_key']);
  });

  await knex.raw(`
    ALTER TABLE rental_requests
      ADD CONSTRAINT rental_requests_status_check
        CHECK (status IN ('PENDING', 'CONFIRMED'));
  `);

  await knex.raw(`
    ALTER TABLE rental_requests
      ADD CONSTRAINT rental_requests_place_period_excl
        EXCLUDE USING gist (
          place_key WITH =,
          tstzrange(period_from, period_to, '[]') WITH &&
        );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE IF EXISTS rental_requests
      DROP CONSTRAINT IF EXISTS rental_requests_place_period_excl;
  `);
  await knex.raw(`
    ALTER TABLE IF EXISTS rental_requests
      DROP CONSTRAINT IF EXISTS rental_requests_status_check;
  `);
  await knex.schema.dropTableIfExists('rental_requests');
  await knex.raw('DROP EXTENSION IF EXISTS btree_gist;');
}
