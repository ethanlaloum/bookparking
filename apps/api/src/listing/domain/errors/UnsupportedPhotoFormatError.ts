export class UnsupportedPhotoFormatError extends Error {
  protected readonly _tag = 'UnsupportedPhotoFormatError';
  constructor() {
    super('Une photo doit être au format JPEG, PNG ou WebP');
  }
}
