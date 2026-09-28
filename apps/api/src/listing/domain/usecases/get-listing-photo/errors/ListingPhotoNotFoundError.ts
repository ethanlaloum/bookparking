export class ListingPhotoNotFoundError extends Error {
  protected readonly _tag = 'ListingPhotoNotFoundError';
  constructor() {
    super('Cette photo est introuvable');
  }
}
