export class AvailabilityPeriodExpiredError extends Error {
  protected readonly _tag = 'AvailabilityPeriodExpiredError';
  constructor() {
    super('La période de disponibilité est déjà passée');
  }
}
