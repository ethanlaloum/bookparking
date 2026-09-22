export class NotABackOfficeAdminError extends Error {
  protected readonly _tag = 'NotABackOfficeAdminError';
  constructor() {
    super("Cette action est réservée à l'administration du site");
  }
}
