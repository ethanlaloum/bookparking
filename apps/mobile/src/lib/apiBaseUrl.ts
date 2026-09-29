import Constants from 'expo-constants';

const API_PORT = 3000;

/**
 * Sur l'iPhone, `localhost` désigne le téléphone, pas le Mac où tourne l'api.
 * Expo Go charge le bundle depuis l'adresse du Mac sur le réseau local
 * (`hostUri`, par exemple `192.168.1.98:8081`) : l'api écoute sur la même
 * machine, au port 3000. `EXPO_PUBLIC_API_BASE_URL` reste prioritaire, pour
 * viser une autre api ou passer par un tunnel.
 *
 * Contrairement au site, pas de préfixe `/api` : c'est le proxy de Vite qui le
 * retire, et l'app parle directement à l'api.
 */
const devHost = (): string => {
  const hostUri = Constants.expoConfig?.hostUri ?? null;
  return hostUri === null ? 'localhost' : (hostUri.split(':')[0] ?? 'localhost');
};

export const resolveApiBaseUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured !== undefined && configured !== '') return configured.replace(/\/$/u, '');
  return `http://${devHost()}:${String(API_PORT)}`;
};

const FRONT_PORT = 5173;

/**
 * Le site, pour les pages qui n'existent que là-bas (conditions d'utilisation,
 * données personnelles). En développement, Vite n'écoute que sur le Mac :
 * `pnpm front dev --host` le rend joignable depuis le téléphone.
 */
export const resolveFrontBaseUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_FRONT_BASE_URL;
  if (configured !== undefined && configured !== '') return configured.replace(/\/$/u, '');
  return `http://${devHost()}:${String(FRONT_PORT)}`;
};
