import type { Knex } from 'knex';

// Les quatre réglages de location quittent les variables d'environnement pour
// le back-office (D-14). La table garde une ligne par version : la dernière est
// en vigueur, les précédentes disent qui a changé quoi, quand et pourquoi.
// La première version reprend ce que l'api lisait jusqu'ici, pour qu'aucun
// déploiement ne change un délai en silence.
const numberFromEnvironment = (name: string, fallback: number): number => {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
};

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('platform_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.decimal('platform_fee_percent', 5, 2).notNullable();
    table.integer('free_cancellation_hours').notNullable();
    table.integer('request_expiry_hours').notNullable();
    table.integer('payout_release_delay_hours').notNullable();
    table.timestamp('effective_from', { useTz: true }).notNullable();
    table.uuid('changed_by').nullable();
    table.text('reason').nullable();
    table.index(['effective_from'], 'platform_settings_effective_from_index');
  });

  const expiryHours = numberFromEnvironment(
    'RENTAL_REQUEST_EXPIRY_IN_HOURS',
    48,
  );
  const releaseDelayHours = numberFromEnvironment(
    'PAYOUT_RELEASE_DELAY_IN_HOURS',
    24,
  );

  await knex('platform_settings').insert({
    platform_fee_percent: numberFromEnvironment('PLATFORM_FEE_PERCENT', 15),
    free_cancellation_hours: numberFromEnvironment(
      'FREE_CANCELLATION_HOURS_BEFORE_START',
      24,
    ),
    request_expiry_hours: expiryHours,
    payout_release_delay_hours: releaseDelayHours,
    effective_from: knex.fn.now(),
    changed_by: null,
    reason: null,
  });

  // Figés sur chaque demande, comme la commission et l'échéance d'annulation :
  // un délai changé plus tard ne touche que les demandes suivantes. Les
  // demandes d'avant reçoivent le délai qui leur était appliqué.
  await knex.schema.alterTable('rental_requests', (table) => {
    table.integer('request_expiry_hours').notNullable().defaultTo(48);
    table.integer('payout_release_delay_hours').notNullable().defaultTo(24);
  });
  await knex('rental_requests').update({
    request_expiry_hours: expiryHours,
    payout_release_delay_hours: releaseDelayHours,
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rental_requests', (table) => {
    table.dropColumn('request_expiry_hours');
    table.dropColumn('payout_release_delay_hours');
  });
  await knex.schema.dropTableIfExists('platform_settings');
}
