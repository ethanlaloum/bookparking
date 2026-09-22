import type { components } from '../../../../api/schema';

export type AdminListing = components['schemas']['AdminListing'];
export type AdminListingStatus = AdminListing['status'];

export const isActive = (listing: AdminListing): boolean => listing.status === 'ACTIVE';

/**
 * Report ligne à ligne du `attentionOverview` de l'api : une annonce **active**
 * dont les trois paliers sont vides. Une annonce dépubliée sans tarif n'est pas
 * un problème — plus personne ne la voit. Si le barème gagne un palier côté
 * api, cette fonction doit le gagner aussi, sinon le compteur du tableau de
 * bord et la colonne de la liste diront deux choses différentes.
 */
export const hasNoPrice = (listing: AdminListing): boolean =>
  isActive(listing) &&
  listing.pricing.dayInCents === null &&
  listing.pricing.weekInCents === null &&
  listing.pricing.monthInCents === null;

export const byMostRecentlyPublished = (left: AdminListing, right: AdminListing): number =>
  Date.parse(right.publishedAt) - Date.parse(left.publishedAt);

export const countActive = (listings: readonly AdminListing[]): number =>
  listings.filter(isActive).length;
