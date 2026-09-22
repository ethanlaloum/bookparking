export class RentalRequestNotFoundError extends Error {
  constructor() {
    super("Cette demande de location n'existe pas");
    this.name = 'RentalRequestNotFoundError';
  }
}
