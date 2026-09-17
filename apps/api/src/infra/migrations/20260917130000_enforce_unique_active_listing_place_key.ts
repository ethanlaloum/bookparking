import type { Knex } from 'knex';

// Frozen copy of Listing.placeKeyOf as of this migration, kept in JavaScript on purpose:
// Postgres `\s` does not fold U+00A0, U+2000-200A or U+FEFF and `lower()` depends on the
// collation, so a SQL backfill writes keys the runtime never produces and the partial
// unique index lets a duplicate active listing through. Never import the domain here —
// a later change to the entity must not rewrite what this migration already did.
const normalizePlacePart = (part: string): string =>
  part.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();

const placeKeyOf = (address: string, box: string): string =>
  JSON.stringify([normalizePlacePart(address), normalizePlacePart(box)]);

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('listings', (table) => {
    table.text('place_key');
  });

  const rows = await knex<{ id: string; address: string; box: string }>(
    'listings',
  ).select('id', 'address', 'box');

  for (const row of rows) {
    await knex('listings')
      .where({ id: row.id })
      .update({ place_key: placeKeyOf(row.address, row.box) });
  }

  await knex.schema.alterTable('listings', (table) => {
    table.text('place_key').notNullable().alter();
  });

  await knex.raw('DROP INDEX IF EXISTS listings_active_place_unique;');

  await knex.raw(`
    CREATE UNIQUE INDEX listings_active_place_key_unique
      ON listings (place_key)
      WHERE status = 'ACTIVE';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS listings_active_place_key_unique;');

  await knex.raw(`
    CREATE UNIQUE INDEX listings_active_place_unique
      ON listings (address, box)
      WHERE status = 'ACTIVE';
  `);

  await knex.schema.alterTable('listings', (table) => {
    table.dropColumn('place_key');
  });
}
