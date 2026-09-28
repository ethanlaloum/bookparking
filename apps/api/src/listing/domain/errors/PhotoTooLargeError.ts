export class PhotoTooLargeError extends Error {
  protected readonly _tag = 'PhotoTooLargeError';
  constructor() {
    super('Une photo ne doit pas dépasser 10 Mo');
  }
}
