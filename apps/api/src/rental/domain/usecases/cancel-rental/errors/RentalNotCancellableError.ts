export class RentalNotCancellableError extends Error {
  protected readonly _tag = 'RentalNotCancellableError';
  constructor() {
    super(
      "Cette demande ne peut pas être annulée : elle n'est ni en attente du propriétaire, ni confirmée",
    );
    this.name = 'RentalNotCancellableError';
  }
}
