export class DatesAlreadyRentedError extends Error {
  protected readonly _tag = 'DatesAlreadyRentedError';
  constructor() {
    super('Ces dates sont déjà louées');
  }
}
