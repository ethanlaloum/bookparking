export class RentalIssueAlreadyResolvedError extends Error {
  protected readonly _tag = 'RentalIssueAlreadyResolvedError';
  constructor() {
    super('Cette réclamation a déjà été tranchée');
  }
}
