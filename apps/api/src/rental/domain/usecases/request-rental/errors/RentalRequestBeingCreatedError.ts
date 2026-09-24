export class RentalRequestBeingCreatedError extends Error {
  protected readonly _tag = 'RentalRequestBeingCreatedError';
  constructor() {
    super('Votre demande est en cours de création, réessayez dans un instant');
    this.name = 'RentalRequestBeingCreatedError';
  }
}
