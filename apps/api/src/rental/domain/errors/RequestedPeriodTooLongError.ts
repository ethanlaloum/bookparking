export class RequestedPeriodTooLongError extends Error {
  protected readonly _tag = 'RequestedPeriodTooLongError';
  constructor() {
    super('La période demandée dépasse la durée maximale de 366 jours');
  }
}
