import type { Knex } from 'knex';

const INTENT_INDEX = 'rental_requests_renter_idempotency_key_unique';

// L'identifiant d'intention n'est unique que pour un même compte : deux
// comptes qui tireraient le même UUID ne se verraient jamais l'un l'autre.
// L'index est partiel parce que les demandes d'avant n'en portent aucun, et
// qu'une tentative que Stripe n'a pas pu ouvrir rend le sien.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rental_requests', (table) => {
    table.text('idempotency_key').nullable();
    table
      .text('checkout_url')
      .nullable()
      .comment(
        'The Stripe Checkout page, kept so that a replayed intent answers the same page.',
      );
  });
  await knex.raw(
    `CREATE UNIQUE INDEX ${INTENT_INDEX} ON rental_requests (renter_id, idempotency_key) WHERE idempotency_key IS NOT NULL`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${INTENT_INDEX}`);
  await knex.schema.alterTable('rental_requests', (table) => {
    table.dropColumn('checkout_url');
    table.dropColumn('idempotency_key');
  });
}
