import { Knex } from 'knex';

const VEHICLES = ['velo', 'moto', 'voiture', 'electrique', 'utilitaire'];
const CONSTRAINT = 'listings_accepted_vehicles_check';

/**
 * Un tableau, parce qu'une place accepte plusieurs gabarits : un box qui prend
 * une citadine prend aussi un vélo. Le défaut est le tableau vide, qui se lit
 * « non déclaré » — jamais « n'accepte rien ». Les annonces publiées avant
 * cette migration le restent, et une recherche par véhicule ne doit pas les
 * faire disparaître pour autant.
 *
 * La contrainte fige le vocabulaire en base, et pas seulement dans le code :
 * `<@` vérifie que chaque valeur du tableau appartient à la liste, ce qu'un
 * `CHECK` sur une colonne texte ne saurait faire pour plusieurs valeurs.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('listings', (table) => {
    table
      .specificType('accepted_vehicles', 'text[]')
      .notNullable()
      .defaultTo(knex.raw("'{}'::text[]"));
  });

  // Postgres n'accepte aucun paramètre lié dans l'expression d'un `CHECK` :
  // c'est du DDL, il n'y a pas de plan à préparer, et la liaison échoue avec
  // « bind message supplies 5 parameters, but prepared statement requires 0 ».
  // Les valeurs sont donc écrites littéralement — elles sont une constante du
  // code, jamais une entrée, et la garde ci-dessous le maintient vrai.
  if (VEHICLES.some((vehicle) => !/^[a-z]+$/u.test(vehicle)))
    throw new Error('Un type de véhicule doit rester un identifiant simple.');

  const liste = VEHICLES.map((vehicle) => `'${vehicle}'`).join(', ');
  await knex.raw(
    `ALTER TABLE listings ADD CONSTRAINT ${CONSTRAINT} CHECK (accepted_vehicles <@ ARRAY[${liste}]::text[])`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE listings DROP CONSTRAINT IF EXISTS ${CONSTRAINT}`,
  );
  await knex.schema.alterTable('listings', (table) => {
    table.dropColumn('accepted_vehicles');
  });
}
