export class ActiveListingNotFoundError extends Error {
  protected readonly _tag = 'ActiveListingNotFoundError';
  constructor() {
    super("Cette place n'a aucune annonce active");
  }
}
