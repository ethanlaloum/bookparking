import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import knex, { Knex } from 'knex';

import { TEST_DATABASE_NAME, buildTestKnexConfig } from './testKnexfile';

const STOP_TIMEOUT_IN_MS = 30000;

let container: StartedPostgreSqlContainer | null = null;
let testDbConnection: Knex | null = null;

const withTimeout = async <T>(
  operation: Promise<T>,
  label: string,
): Promise<T | undefined> =>
  Promise.race([
    operation,
    new Promise<undefined>((resolve) =>
      setTimeout(() => {
        process.stderr.write(`${label} timed out\n`);
        resolve(undefined);
      }, STOP_TIMEOUT_IN_MS).unref(),
    ),
  ]);

export const startTestDatabase = async (): Promise<Knex> => {
  if (testDbConnection) return testDbConnection;

  container = await new PostgreSqlContainer('postgres:15')
    .withDatabase(TEST_DATABASE_NAME)
    .withUsername('test')
    .withPassword('test')
    .start();

  testDbConnection = knex(
    buildTestKnexConfig({
      host: container.getHost(),
      port: container.getPort(),
      user: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    }),
  );

  await testDbConnection.migrate.latest();
  return testDbConnection;
};

export const getTestDbConnection = (): Knex => {
  if (!testDbConnection)
    throw new Error(
      'getTestDbConnection called before startTestDatabase resolved.',
    );
  return testDbConnection;
};

const assertEphemeralTestDatabase = async (connection: Knex): Promise<void> => {
  if (!container)
    throw new Error('cleanDatabase aborted: no test container is running.');

  const { rows } = await connection.raw<{ rows: { db: string }[] }>(
    'SELECT current_database() AS db',
  );
  if (rows[0]?.db !== TEST_DATABASE_NAME)
    throw new Error(
      `cleanDatabase aborted: connected to "${rows[0]?.db}", not "${TEST_DATABASE_NAME}".`,
    );
};

export const cleanDatabase = async (): Promise<void> => {
  const connection = getTestDbConnection();
  await assertEphemeralTestDatabase(connection);

  const { rows } = await connection.raw<{ rows: { tablename: string }[] }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename NOT LIKE 'knex_migrations%'`,
  );
  if (rows.length === 0) return;

  const tables = rows.map((row) => `"${row.tablename}"`).join(', ');
  await connection.raw(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
};

export const stopTestDatabase = async (): Promise<void> => {
  if (testDbConnection) {
    await withTimeout(testDbConnection.destroy(), 'knex destroy');
    testDbConnection = null;
  }
  if (container) {
    await withTimeout(container.stop(), 'container stop');
    container = null;
  }
};
