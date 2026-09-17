export class NoPriceForRequestedPeriodError extends Error {
  protected readonly _tag = 'NoPriceForRequestedPeriodError';
  constructor() {
    super('Aucun tarif ne couvre la période demandée');
  }
}
