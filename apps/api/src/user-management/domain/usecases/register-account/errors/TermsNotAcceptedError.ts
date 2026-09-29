export class TermsNotAcceptedError extends Error {
  protected readonly _tag = 'TermsNotAcceptedError';
  constructor() {
    super("Cochez la case pour accepter les conditions d'utilisation.");
  }
}
