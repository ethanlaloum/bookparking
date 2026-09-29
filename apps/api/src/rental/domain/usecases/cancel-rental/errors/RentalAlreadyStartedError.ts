export class RentalAlreadyStartedError extends Error {
  protected readonly _tag = 'RentalAlreadyStartedError';
  constructor() {
    super('Cette location a commencé : elle ne peut plus être annulée');
    this.name = 'RentalAlreadyStartedError';
  }
}
