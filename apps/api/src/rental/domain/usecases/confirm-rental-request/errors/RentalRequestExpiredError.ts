export class RentalRequestExpiredError extends Error {
  constructor() {
    super('Cette demande de location a expiré et ne peut plus être confirmée');
    this.name = 'RentalRequestExpiredError';
  }
}
