export class IncompletePricingError extends Error {
  protected readonly _tag = 'IncompletePricingError';
  constructor() {
    super('La grille tarifaire est incomplète');
  }
}
