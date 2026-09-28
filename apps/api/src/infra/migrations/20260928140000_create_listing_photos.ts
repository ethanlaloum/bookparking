import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('listing_photos', (table) => {
    table.uuid('id').primary();
    table
      .text('owner_id')
      .notNullable()
      .index()
      .comment(
        'Personal data: a photo of a place may show a car, a plate or a face. Erased with the account.',
      );
    table.text('format').notNullable();
    table.binary('bytes').notNullable();
    table.timestamp('uploaded_at', { useTz: true }).notNullable();
  });

  await knex.raw(`
    ALTER TABLE listing_photos
      ADD CONSTRAINT listing_photos_format_check
        CHECK (format IN ('image/jpeg', 'image/png', 'image/webp'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('listing_photos');
}
