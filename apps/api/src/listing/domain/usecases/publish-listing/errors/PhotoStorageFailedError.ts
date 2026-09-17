export class PhotoStorageFailedError extends Error {
  protected readonly _tag = 'PhotoStorageFailedError';
  constructor() {
    super("Impossible d'enregistrer les photos");
  }
}
