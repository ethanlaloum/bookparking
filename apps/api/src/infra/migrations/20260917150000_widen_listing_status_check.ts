import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE listings
      DROP CONSTRAINT IF EXISTS listings_status_check;
  `);

  await knex.raw(`
    ALTER TABLE listings
      ADD CONSTRAINT listings_status_check
        CHECK (status IN ('ACTIVE', 'UNPUBLISHED'));
  `);
}

// Aborts on the first unpublished listing: ADD CONSTRAINT validates existing rows, and
// 'UNPUBLISHED' is exactly the value this migration made storable. Rolling back requires
// deciding what those listings become first — republishing them re-exposes a place its
// owner withdrew, deleting them loses the withdrawal itself.
export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE listings
      DROP CONSTRAINT IF EXISTS listings_status_check;
  `);

  await knex.raw(`
    ALTER TABLE listings
      ADD CONSTRAINT listings_status_check
        CHECK (status IN ('ACTIVE'));
  `);
}
