import type { Knex } from 'knex';

// Le pilote choisi comme avatar, à l'inscription puis dans « Réglages ». Les
// comptes d'avant le choix reçoivent le premier, `SIGNAL`.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accounts', (table) => {
    table.text('avatar').notNullable().defaultTo('SIGNAL');
  });

  await knex.raw(`
    ALTER TABLE accounts
      ADD CONSTRAINT accounts_avatar_check
        CHECK (avatar IN ('SIGNAL', 'MARKING', 'RIVIERA', 'ASPHALT', 'CHECKERED'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accounts', (table) => {
    table.dropColumn('avatar');
  });
}
