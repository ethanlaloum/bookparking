import type { Knex } from 'knex';
import * as path from 'path';

export const TEST_DATABASE_NAME = 'testdb';

export const buildTestKnexConfig = (connection: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}): Knex.Config => ({
  client: 'pg',
  connection,
  pool: { min: 0, max: 1 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    loadExtensions: ['.ts'],
  },
});
