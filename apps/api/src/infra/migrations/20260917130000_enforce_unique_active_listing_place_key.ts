import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('listings', (table) => {
    table.text('place_key');
  });

  await knex.raw(`
    UPDATE listings
       SET place_key = '['
         || to_json(lower(btrim(regexp_replace(normalize(address, NFKC), '\\s+', ' ', 'g'), ' ')))::text
         || ','
         || to_json(lower(btrim(regexp_replace(normalize(box, NFKC), '\\s+', ' ', 'g'), ' ')))::text
         || ']';
  `);

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
