export class InvalidRequestedPeriodError extends Error {
  protected readonly _tag = 'InvalidRequestedPeriodError';
  constructor() {
    super('Les dates demandées sont invalides');
  }
}
