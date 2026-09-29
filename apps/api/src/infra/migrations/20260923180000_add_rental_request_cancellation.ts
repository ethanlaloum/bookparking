import type { Knex } from 'knex';

const CANCELLED_BY_CHECK = 'rental_requests_cancelled_by_check';

// L'échéance d'annulation gratuite est figée sur chaque demande (SPEC-005,
// Q-13 tranchée par JP) : un délai modifié plus tard ne la déplace pas. Les
// demandes déjà faites reçoivent celle du délai par défaut, 24 heures avant
// leur premier instant — la seule valeur qui existait quand elles ont été
// faites.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rental_requests', (table) => {
    table.timestamp('free_cancellation_until', { useTz: true }).nullable();
    table.timestamp('cancelled_at', { useTz: true }).nullable();
    table.text('cancelled_by').nullable();
  });
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT ${CANCELLED_BY_CHECK} CHECK (cancelled_by IS NULL OR cancelled_by IN ('OPERATOR', 'RENTER', 'OWNER'))`,
  );
  await knex.raw(
    `UPDATE rental_requests SET free_cancellation_until = period_from - interval '24 hours' WHERE free_cancellation_until IS NULL`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE rental_requests DROP CONSTRAINT IF EXISTS ${CANCELLED_BY_CHECK}`,
  );
  await knex.schema.alterTable('rental_requests', (table) => {
    table.dropColumn('cancelled_by');
    table.dropColumn('cancelled_at');
    table.dropColumn('free_cancellation_until');
  });
}
