import type { components } from '../../../../api/schema';

export type AdminAccount = components['schemas']['AdminAccount'];

export const isSuspended = (account: AdminAccount): boolean => account.suspendedAt !== null;

/**
 * Report du `attentionOverview` de l'api : un compte sans aucune annonce et
 * sans aucune demande. Le DTO porte les deux compteurs, donc la règle se relit
 * ici sans risque de dérive — contrairement aux deux autres colonnes du bloc
 * « à surveiller », qui dépendent d'une date ou d'un barème.
 */
export const hasNoActivity = (account: AdminAccount): boolean =>
  account.listingCount === 0 && account.requestCount === 0;

export const byMostRecentlyRegistered = (left: AdminAccount, right: AdminAccount): number =>
  Date.parse(right.registeredAt) - Date.parse(left.registeredAt);

export const countSuspended = (accounts: readonly AdminAccount[]): number =>
  accounts.filter(isSuspended).length;
