export class PayoutAccountNotReadyError extends Error {
  protected readonly _tag = 'PayoutAccountNotReadyError';
  constructor() {
    super('Vos coordonnées bancaires ne sont pas encore validées par Stripe');
    this.name = 'PayoutAccountNotReadyError';
  }
}
