import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { readStripeSecretKey, startStripeListener, type StripeListener } from './stripe';
import { apiPort, readTarget, STACK_FILE, type StackHandle } from './target';

const REPO_ROOT = resolve(process.cwd(), '..', '..');
const API_DIR = resolve(REPO_ROOT, 'apps', 'api');

// Le secret n'a de sens que le temps du conteneur : la base est ephemere et
// aucun jeton emis ici ne survit a la fin du run.
const ACCESS_TOKEN_SECRET = 'e2e-secret-local-ephemere-32-caracteres';

let container: StartedPostgreSqlContainer | null = null;
let api: ChildProcess | null = null;
let stripeListener: StripeListener | null = null;

const run = (command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<void> =>
  new Promise((done, fail) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit' });
    child.on('error', fail);
    child.on('exit', (code) =>
      code === 0 ? done() : fail(new Error(`${command} ${args.join(' ')} a fini en ${String(code)}`)),
    );
  });

const waitForApi = async (apiUrl: string): Promise<void> => {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${apiUrl}/listing`);
      if (response.ok) return;
    } catch {
      /* l'api n'ecoute pas encore */
    }
    await new Promise((sleep) => setTimeout(sleep, 500));
  }
  throw new Error(`L'api n'a pas repondu 200 sur ${apiUrl}/listing en 90 s.`);
};

export const startLocalStack = async (): Promise<void> => {
  const target = readTarget();
  const handlePath = resolve(process.cwd(), STACK_FILE);
  await mkdir(dirname(handlePath), { recursive: true });

  if (target.name === 'dev' || process.env.E2E_LOCAL_REUSE_STACK === 'true') {
    await waitForApi(target.apiUrl);
    const handle: StackHandle = { target, databaseUrl: null };
    await writeFile(handlePath, JSON.stringify(handle, null, 2));
    return;
  }

  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('bookparking_e2e')
    .withUsername('bookparking')
    .withPassword('bookparking')
    .start();

  const databaseUrl = container.getConnectionUri();

  // Le knexfile de l'api lit ses migrations dans `dist/infra/migrations` avec
  // l'extension `.js` : sans build prealable, `migrate:latest` ne trouve aucune
  // migration et repond « Already up to date » sur une base vide.
  await run('pnpm', ['--filter', 'bookparking-api', 'build'], REPO_ROOT, process.env);

  const stripeSecretKey = await readStripeSecretKey(REPO_ROOT);
  stripeListener = await startStripeListener(
    stripeSecretKey,
    `${target.apiUrl}/payment/stripe-webhook`,
  );

  const apiEnv: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    ACCESS_TOKEN_SECRET,
    PORT: String(apiPort()),
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: stripeListener.webhookSecret,
    FRONT_BASE_URL: target.frontUrl,
    // SPEC-006 Q-03 : les parcours s'inscrivent avec des adresses
    // `@bookparking.test`, qui ne doivent jamais atteindre Resend.
    EMAIL_SENDING: 'disabled',
  };

  await run('pnpm', ['exec', 'knex', 'migrate:latest'], API_DIR, apiEnv);

  api = spawn('node', ['dist/main.js'], { cwd: API_DIR, env: apiEnv, stdio: 'inherit' });
  api.on('error', (error) => {
    throw error;
  });

  await waitForApi(target.apiUrl);

  const handle: StackHandle = { target, databaseUrl };
  await writeFile(handlePath, JSON.stringify(handle, null, 2));
};

export const stopLocalStack = async (): Promise<void> => {
  api?.kill('SIGTERM');
  api = null;
  stripeListener?.stop();
  stripeListener = null;
  await container?.stop();
  container = null;
};
