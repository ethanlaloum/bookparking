import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table
      .text('email')
      .notNullable()
      .comment(
        'Personal data: the address a person typed, stored as given and never normalized here.',
      );
    table
      .text('password_hash')
      .notNullable()
      .comment(
        'scrypt output produced by ScryptPasswordHasher. A plaintext password never reaches this column.',
      );
    table.timestamp('registered_at', { useTz: true }).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE UNIQUE INDEX accounts_email_unique
      ON accounts (email);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS accounts_email_unique;');
  await knex.schema.dropTableIfExists('accounts');
}
