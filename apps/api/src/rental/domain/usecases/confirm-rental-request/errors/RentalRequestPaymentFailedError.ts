export class RentalRequestPaymentFailedError extends Error {
  protected readonly _tag = 'RentalRequestPaymentFailedError';
  constructor() {
    super(
      'La banque du conducteur a refusé le prélèvement : la location ne peut pas être confirmée',
    );
    this.name = 'RentalRequestPaymentFailedError';
  }
}
