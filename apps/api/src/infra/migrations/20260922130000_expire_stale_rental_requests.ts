import type { Knex } from 'knex';

// Marquer une demande EXPIRED ne dégèle rien tant que la contrainte d'exclusion
// ignore le statut : elle interdit deux lignes qui se chevauchent sur la même
// place, quel que soit leur statut (AUTO-26). C'est donc la contrainte elle-même
// qui doit cesser de voir les demandes expirées — d'où sa reconstruction en
// contrainte partielle.
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE rental_requests
      DROP CONSTRAINT rental_requests_status_check;
  `);
  await knex.raw(`
    ALTER TABLE rental_requests
      ADD CONSTRAINT rental_requests_status_check
        CHECK (status IN ('PENDING', 'CONFIRMED', 'EXPIRED'));
  `);

  await knex.raw(`
    ALTER TABLE rental_requests
      DROP CONSTRAINT rental_requests_place_period_excl;
  `);
  await knex.raw(`
    ALTER TABLE rental_requests
      ADD CONSTRAINT rental_requests_place_period_excl
        EXCLUDE USING gist (
          place_key WITH =,
          tstzrange(period_from, period_to, '[]') WITH &&
        )
        WHERE (status <> 'EXPIRED');
  `);
}

// Le retour arrière réinstalle la contrainte totale et le CHECK d'origine : les
// deux échouent si une seule ligne EXPIRED subsiste — la première parce qu'une
// demande expirée peut chevaucher une demande vivante, la seconde parce que son
// statut n'est plus autorisé. Purger ces lignes est une décision, pas un détail
// de rollback : ce down() ne la prend pas à la place de qui l'exécute.
export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE rental_requests
      DROP CONSTRAINT rental_requests_place_period_excl;
  `);
  await knex.raw(`
    ALTER TABLE rental_requests
      ADD CONSTRAINT rental_requests_place_period_excl
        EXCLUDE USING gist (
          place_key WITH =,
          tstzrange(period_from, period_to, '[]') WITH &&
        );
  `);

  await knex.raw(`
    ALTER TABLE rental_requests
      DROP CONSTRAINT rental_requests_status_check;
  `);
  await knex.raw(`
    ALTER TABLE rental_requests
      ADD CONSTRAINT rental_requests_status_check
        CHECK (status IN ('PENDING', 'CONFIRMED'));
  `);
}
