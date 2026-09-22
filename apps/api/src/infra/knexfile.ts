import type { Knex } from 'knex';
import * as path from 'path';

import { environment } from './config/environment';

export const buildKnexConfig = (): Knex.Config => ({
  client: 'pg',
  connection: environment.databaseUrl(),
  pool: { min: 0, max: 10 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    loadExtensions: ['.ts', '.js'],
  },
});
