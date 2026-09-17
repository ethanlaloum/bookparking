export class ListingNotOwnedError extends Error {
  protected readonly _tag = 'ListingNotOwnedError';
  constructor() {
    super('Cette annonce ne vous appartient pas');
  }
}
