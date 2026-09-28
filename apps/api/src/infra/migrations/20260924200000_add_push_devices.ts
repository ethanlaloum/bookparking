import type { Knex } from 'knex';

// Les téléphones qui reçoivent les notifications push, et ce qu'il reste à
// pousser. Un jeton Expo désigne un téléphone : il n'appartient qu'à un compte
// à la fois, celui qui s'y est connecté en dernier.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('push_devices', (table) => {
    table
      .text('token')
      .primary()
      .comment(
        'Personal data: the Expo push token of one phone. Forgotten on sign-out, when Expo reports the app uninstalled, and with the account (SPEC-003).',
      );
    table.text('account_id').notNullable().index();
    table.timestamp('registered_at', { useTz: true }).notNullable();
  });

  await knex.schema.alterTable('notifications', (table) => {
    table.timestamp('pushed_at', { useTz: true }).nullable();
  });

  // Les notifications d'avant le push ne partiront jamais : elles sont
  // réputées poussées, sans quoi le premier balayage les enverrait toutes.
  await knex('notifications').update({ pushed_at: knex.ref('created_at') });

  await knex.raw(`
    CREATE INDEX notifications_unpushed_created_at_idx
      ON notifications (created_at)
      WHERE pushed_at IS NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS notifications_unpushed_created_at_idx');
  await knex.schema.alterTable('notifications', (table) => {
    table.dropColumn('pushed_at');
  });
  await knex.schema.dropTableIfExists('push_devices');
}
