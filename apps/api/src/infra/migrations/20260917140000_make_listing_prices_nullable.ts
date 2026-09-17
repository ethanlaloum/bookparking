import type { Knex } from 'knex';

const PRICE_COLUMNS = [
  'day_price_in_cents',
  'week_price_in_cents',
  'month_price_in_cents',
] as const;

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('listings', (table) => {
    for (const column of PRICE_COLUMNS) {
      table.setNullable(column);
    }
  });
}

// Irreversible once a listing omits a duration: SET NOT NULL aborts on the first null
// price, and inventing a price to backfill it would publish a tariff the owner never set.
// Rolling back requires deciding the fate of those listings first.
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('listings', (table) => {
    for (const column of PRICE_COLUMNS) {
      table.dropNullable(column);
    }
  });
}
