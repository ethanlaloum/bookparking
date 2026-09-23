import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const runFile = promisify(execFile);

// Les événements que l'api lit ; les autres ne servent à rien et encombrent le
// journal de la CLI.
const FORWARDED_EVENTS = [
  'payment_intent.amount_capturable_updated',
  'checkout.session.expired',
].join(',');

export interface StripeListener {
  webhookSecret: string;
  stop: () => void;
}

const parseEnvFile = (content: string): Record<string, string> =>
  Object.fromEntries(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

/**
 * La clé de test vient de l'environnement, ou de `.env.stripe.local` à la
 * racine du dépôt — un fichier ignoré par git, rempli à la main, pour que la
 * clé ne transite jamais par une commande ou un journal.
 */
export const readStripeSecretKey = async (repoRoot: string): Promise<string> => {
  let key = process.env.STRIPE_SECRET_KEY ?? '';
  if (key === '') {
    try {
      const content = await readFile(resolve(repoRoot, '.env.stripe.local'), 'utf-8');
      key = parseEnvFile(content).STRIPE_SECRET_KEY ?? '';
    } catch {
      /* le fichier n'existe pas : le message ci-dessous dit quoi faire */
    }
  }
  if (!key.startsWith('sk_test_'))
    throw new Error(
      "Les parcours e2e exigent une clé Stripe de test (sk_test_…) : renseignez STRIPE_SECRET_KEY dans .env.stripe.local, à la racine du dépôt. Une clé de production n'est jamais acceptée ici.",
    );
  return key;
};

const ensureCli = async (): Promise<void> => {
  try {
    await runFile('stripe', ['version']);
  } catch {
    throw new Error(
      'La CLI Stripe est introuvable. Installez-la : brew install stripe/stripe-cli/stripe',
    );
  }
};

/**
 * Stripe ne peut pas joindre une api qui écoute sur localhost : la CLI tient
 * une connexion ouverte et relaie chaque événement vers l'api locale, signé
 * avec un secret propre à ce poste, que `--print-secret` rend sans rien
 * écouter.
 */
export const startStripeListener = async (
  secretKey: string,
  forwardTo: string,
): Promise<StripeListener> => {
  await ensureCli();
  const { stdout } = await runFile('stripe', ['listen', '--api-key', secretKey, '--print-secret']);
  const webhookSecret = stdout.trim();

  const listener: ChildProcess = spawn(
    'stripe',
    ['listen', '--api-key', secretKey, '--events', FORWARDED_EVENTS, '--forward-to', forwardTo],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  await new Promise<void>((ready, fail) => {
    const timer = setTimeout(
      () => fail(new Error("stripe listen n'est pas prêt au bout de 30 s")),
      30_000,
    );
    const watch = (chunk: Buffer) => {
      if (chunk.toString().includes('Ready!')) {
        clearTimeout(timer);
        ready();
      }
    };
    listener.stdout?.on('data', watch);
    listener.stderr?.on('data', watch);
    listener.on('error', fail);
  });

  return { webhookSecret, stop: () => listener.kill('SIGTERM') };
};
