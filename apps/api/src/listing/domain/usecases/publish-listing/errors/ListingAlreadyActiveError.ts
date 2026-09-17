export class ListingAlreadyActiveError extends Error {
  protected readonly _tag = 'ListingAlreadyActiveError';
  constructor() {
    super('Cette place a déjà une annonce active');
  }
}
