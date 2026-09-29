import type { Knex } from 'knex';

const STATUS_CHECK = 'rental_requests_status_check';
const MONEY_CHECK = 'rental_requests_money_status_check';
const PLACE_PERIOD_EXCLUSION = 'rental_requests_place_period_excl';

// Une demande qui n'est pas encore payée retient ses dates comme une demande
// en attente du loueur : deux conducteurs ne doivent jamais pouvoir payer la
// même période. Abandonnée ou refusée par la banque, elle les rend — d'où leur
// place dans la clause WHERE, à côté d'EXPIRED et de CANCELLED.
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE rental_requests DROP CONSTRAINT ${STATUS_CHECK}`);
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT ${STATUS_CHECK} CHECK (status IN ('AWAITING_PAYMENT', 'PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'ABANDONED', 'PAYMENT_FAILED'))`,
  );

  await knex.schema.alterTable('rental_requests', (table) => {
    table
      .text('money_status')
      .notNullable()
      .defaultTo('NONE')
      .comment(
        'Where the renter money stands. NONE for every request made before payments.',
      );
    table.text('checkout_session_id').nullable();
    table.text('payment_id').nullable();
    table.timestamp('hold_placed_at', { useTz: true }).nullable();
    table.text('refund_id').nullable();
  });

  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT ${MONEY_CHECK} CHECK (money_status IN ('NONE', 'AUTHORIZED', 'CAPTURED', 'RELEASE_DUE', 'RELEASED', 'REFUND_DUE', 'REFUNDED'))`,
  );
  await knex.raw(
    `CREATE INDEX rental_requests_money_owed_idx ON rental_requests (money_status) WHERE money_status IN ('RELEASE_DUE', 'REFUND_DUE')`,
  );

  await knex.raw(
    `ALTER TABLE rental_requests DROP CONSTRAINT ${PLACE_PERIOD_EXCLUSION}`,
  );
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT ${PLACE_PERIOD_EXCLUSION}
     EXCLUDE USING gist (place_key WITH =, tstzrange(period_from, period_to, '[]') WITH &&)
     WHERE (status NOT IN ('EXPIRED', 'CANCELLED', 'ABANDONED', 'PAYMENT_FAILED'))`,
  );
}

// Le retour arrière échoue dès qu'une ligne porte un statut de paiement : une
// demande abandonnée peut chevaucher une demande vivante, et les statuts
// d'attente et d'abandon ne sont plus admis. Décider du sort de ces lignes est
// une décision, pas un détail de rollback.
export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE rental_requests DROP CONSTRAINT ${PLACE_PERIOD_EXCLUSION}`,
  );
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT ${PLACE_PERIOD_EXCLUSION}
     EXCLUDE USING gist (place_key WITH =, tstzrange(period_from, period_to, '[]') WITH &&)
     WHERE (status NOT IN ('EXPIRED', 'CANCELLED'))`,
  );

  await knex.raw('DROP INDEX IF EXISTS rental_requests_money_owed_idx');
  await knex.raw(`ALTER TABLE rental_requests DROP CONSTRAINT ${MONEY_CHECK}`);
  await knex.schema.alterTable('rental_requests', (table) => {
    table.dropColumn('refund_id');
    table.dropColumn('hold_placed_at');
    table.dropColumn('payment_id');
    table.dropColumn('checkout_session_id');
    table.dropColumn('money_status');
  });

  await knex.raw(`ALTER TABLE rental_requests DROP CONSTRAINT ${STATUS_CHECK}`);
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT ${STATUS_CHECK} CHECK (status IN ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED'))`,
  );
}
