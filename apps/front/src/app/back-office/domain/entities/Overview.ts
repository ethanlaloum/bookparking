import type { components } from '../../../../api/schema';

export type Overview = components['schemas']['Overview'];
export type OverviewCounts = Overview['counts'];
export type OverviewActivity = Overview['activity'];
export type OverviewAttention = Overview['attention'];

/**
 * Le tableau de bord n'affiche le bloc « à surveiller » en rouge que s'il y a
 * quelque chose à surveiller. Trois zéros sont une bonne nouvelle, pas une
 * alerte, et les peindre en rouge apprendrait à l'œil à ignorer la couleur.
 */
export const needsAttention = (attention: OverviewAttention): boolean =>
  attention.requestsPendingOverADay > 0 ||
  attention.listingsWithoutAnyPrice > 0 ||
  attention.accountsWithoutAnyActivity > 0;

/**
 * Le rapport entre la fenêtre courte et la fenêtre large. L'api rend les deux
 * bruts : `accountsLast24h` et `accountsLast7d` — et la seconde **contient** la
 * première. Un septième, c'est le rythme de croisière ; au-delà, la journée a
 * été plus forte que la semaine qui la porte.
 */
export const isAccelerating = (last24h: number, last7d: number): boolean =>
  last7d > 0 && last24h * 7 > last7d;
