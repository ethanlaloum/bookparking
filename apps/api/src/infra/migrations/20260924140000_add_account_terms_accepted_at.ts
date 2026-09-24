import type { Knex } from 'knex';

// SPEC-008 : l'instant où le titulaire a coché « J'accepte les conditions
// d'utilisation ». Nullable : les comptes d'avant la case n'en ont pas.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accounts', (table) => {
    table.timestamp('terms_accepted_at', { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accounts', (table) => {
    table.dropColumn('terms_accepted_at');
  });
}
