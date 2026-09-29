export class UnknownPhotoError extends Error {
  protected readonly _tag = 'UnknownPhotoError';
  constructor() {
    super("Une photo de l'annonce n'a pas été envoyée par son propriétaire");
  }
}
