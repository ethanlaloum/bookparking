export class RentalNoLongerRefundableError extends Error {
  protected readonly _tag = 'RentalNoLongerRefundableError';
  constructor() {
    super(
      'Cette réservation a déjà été annulée : elle ne peut plus être remboursée en totalité',
    );
  }
}
