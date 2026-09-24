import type { components } from '../../../../api/schema';

/**
 * Les cinq pilotes entre lesquels on choisit son avatar, à l'inscription puis
 * dans « Réglages », dans l'ordre où l'écran les propose. La liste est celle de
 * l'api (`AVATARS` dans `Account.ts`) ; le dessin vit dans `lib/avatarArt.ts`.
 */
export type Avatar = components['schemas']['Avatar'];

export const AVATARS = [
  'SIGNAL',
  'MARKING',
  'RIVIERA',
  'ASPHALT',
  'CHECKERED',
] as const satisfies readonly Avatar[];

// Proposé d'office à l'inscription, et porté par les comptes d'avant le choix.
export const DEFAULT_AVATAR: Avatar = 'SIGNAL';
