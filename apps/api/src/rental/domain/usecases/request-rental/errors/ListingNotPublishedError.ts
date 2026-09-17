export class ListingNotPublishedError extends Error {
  protected readonly _tag = 'ListingNotPublishedError';
  constructor() {
    super("Cette place n'a aucune annonce publiée");
  }
}
