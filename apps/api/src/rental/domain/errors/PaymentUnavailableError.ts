export class PaymentUnavailableError extends Error {
  protected readonly _tag = 'PaymentUnavailableError';
  constructor() {
    super(
      'Le paiement est momentanément indisponible, réessayez dans un instant',
    );
    this.name = 'PaymentUnavailableError';
  }
}
