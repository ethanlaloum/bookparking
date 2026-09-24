/**
 * L'identifiant d'intention que porte le bouton de réservation. Il suit
 * l'intention — une place, une période — et non le clic : cliquer deux fois,
 * ou recliquer après une réponse perdue, renvoie le même identifiant, et l'api
 * rend la demande déjà créée au lieu d'en créer une seconde. Changer de place
 * ou de période, c'est une autre intention, donc un autre identifiant.
 */
export interface RentalIntent {
  listingId: string;
  fromDay: string;
  toDay: string;
  key: string;
}

const isSameIntent = (current: RentalIntent, wanted: Omit<RentalIntent, 'key'>): boolean =>
  current.listingId === wanted.listingId &&
  current.fromDay === wanted.fromDay &&
  current.toDay === wanted.toDay;

export const keepOrRenewIntent = (
  current: RentalIntent | null,
  wanted: Omit<RentalIntent, 'key'>,
  newKey: () => string,
): RentalIntent =>
  current !== null && isSameIntent(current, wanted) ? current : { ...wanted, key: newKey() };
