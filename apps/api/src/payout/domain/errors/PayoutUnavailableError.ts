export class PayoutUnavailableError extends Error {
  protected readonly _tag = 'PayoutUnavailableError';
  constructor() {
    super(
      'Le service de versement ne répond pas pour le moment. Réessayez dans un instant.',
    );
    this.name = 'PayoutUnavailableError';
  }
}
