export class ListingClosedOnRequestedDaysError extends Error {
  protected readonly _tag = 'ListingClosedOnRequestedDaysError';
  constructor() {
    super("La place n'est pas ouverte sur toute la période demandée");
  }
}
