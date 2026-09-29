import { Knex } from 'knex';

const RENTAL_STATUS_CHECK = 'rental_requests_status_check';

/**
 * La fondation du back-office. Quatre changements, et trois précautions.
 *
 * `back_office_admins` est une table et non une colonne de `accounts` : aucune
 * route ne promeut qui que ce soit, et l'élévation de privilège n'est pas une
 * ligne à modifier mais une ligne à insérer hors de l'application. La clé
 * primaire est l'identifiant du compte, ce qui rend le double octroi
 * impossible.
 *
 * `accounts.suspended_at` est un instant et non un booléen : savoir *quand* une
 * suspension a été prononcée est ce qui permet de la relire, et `NULL` est le
 * seul état « non suspendu ».
 *
 * `admin_action_logs` ne référence pas ses cibles par clé étrangère : un
 * journal doit survivre à la disparition de ce qu'il décrit, sinon supprimer
 * une annonce effacerait la trace de sa modération.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('back_office_admins', (table) => {
    table
      .uuid('account_id')
      .primary()
      .references('id')
      .inTable('accounts')
      .onDelete('CASCADE');
    table.timestamp('granted_at', { useTz: true }).notNullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('accounts', (table) => {
    table.timestamp('suspended_at', { useTz: true }).nullable();
  });

  await knex.schema.createTable('admin_action_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('admin_account_id').notNullable();
    table.text('action').notNullable();
    table.text('target_type').notNullable();
    table.text('target_id').notNullable();
    table.text('reason').nullable();
    table.timestamp('acted_at', { useTz: true }).notNullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.index(['target_type', 'target_id'], 'admin_action_logs_target_index');
  });

  // Une location annulée par un administrateur n'est ni expirée ni confirmée :
  // elle a été rompue, et le statut doit le dire pour que l'historique reste
  // lisible. La contrainte d'exclusion partielle ignore déjà tout ce qui n'est
  // pas CONFIRMED ou PENDING, donc une annulation libère la place.
  await knex.raw(
    `ALTER TABLE rental_requests DROP CONSTRAINT IF EXISTS ${RENTAL_STATUS_CHECK}`,
  );
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT ${RENTAL_STATUS_CHECK} CHECK (status IN ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED'))`,
  );
  await knex.raw(
    `ALTER TABLE rental_requests DROP CONSTRAINT IF EXISTS rental_requests_place_period_excl`,
  );
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT rental_requests_place_period_excl
     EXCLUDE USING gist (place_key WITH =, tstzrange(period_from, period_to, '[]') WITH &&)
     WHERE (status NOT IN ('EXPIRED', 'CANCELLED'))`,
  );
}

/**
 * Le retour arrière échoue si une seule demande est annulée, et c'est voulu :
 * `down()` ne décide pas à votre place de ce que deviennent ces lignes.
 */
export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE rental_requests DROP CONSTRAINT IF EXISTS rental_requests_place_period_excl`,
  );
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT rental_requests_place_period_excl
     EXCLUDE USING gist (place_key WITH =, tstzrange(period_from, period_to, '[]') WITH &&)
     WHERE (status <> 'EXPIRED')`,
  );
  await knex.raw(
    `ALTER TABLE rental_requests DROP CONSTRAINT IF EXISTS ${RENTAL_STATUS_CHECK}`,
  );
  await knex.raw(
    `ALTER TABLE rental_requests ADD CONSTRAINT ${RENTAL_STATUS_CHECK} CHECK (status IN ('PENDING', 'CONFIRMED', 'EXPIRED'))`,
  );

  await knex.schema.dropTableIfExists('admin_action_logs');
  await knex.schema.alterTable('accounts', (table) => {
    table.dropColumn('suspended_at');
  });
  await knex.schema.dropTableIfExists('back_office_admins');
}
