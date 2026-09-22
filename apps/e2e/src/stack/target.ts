export type TargetName = 'local' | 'dev';

export interface Target {
  name: TargetName;
  frontUrl: string;
  apiUrl: string;
  frontOrigin: string;
}

export const apiPort = (): number => Number(process.env.E2E_API_PORT ?? 3100);
export const frontPort = (): number => Number(process.env.E2E_FRONT_PORT ?? 5174);

export const readTarget = (): Target => {
  const name = process.env.E2E_TARGET ?? 'local';

  if (name === 'local') {
    const frontUrl = `http://localhost:${frontPort()}`;
    return {
      name: 'local',
      frontUrl,
      apiUrl: `http://localhost:${apiPort()}`,
      frontOrigin: frontUrl,
    };
  }

  if (name === 'dev') {
    const frontUrl = required('E2E_DEV_FRONT_URL');
    return {
      name: 'dev',
      frontUrl,
      apiUrl: required('E2E_DEV_API_URL'),
      frontOrigin: new URL(frontUrl).origin,
    };
  }

  throw new Error(
    `E2E_TARGET vaut "${name}". Les seules cibles sont "local" et "dev" : une cible ne sert pas à choisir une suite.`,
  );
};

const required = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '')
    throw new Error(`La variable d'environnement ${name} est absente pour la cible dev.`);
  return value;
};

export interface StackHandle {
  target: Target;
  databaseUrl: string | null;
}

export const STACK_FILE = '.e2e/stack.json';
