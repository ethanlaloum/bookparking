export class ListingNotFoundError extends Error {
  protected readonly _tag = 'ListingNotFoundError';
  constructor() {
    super('Annonce introuvable');
  }
}
