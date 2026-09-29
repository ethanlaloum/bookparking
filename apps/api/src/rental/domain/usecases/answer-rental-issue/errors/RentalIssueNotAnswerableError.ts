export class RentalIssueNotAnswerableError extends Error {
  protected readonly _tag = 'RentalIssueNotAnswerableError';
  constructor() {
    super(
      'Aucune réclamation ouverte n’attend votre réponse sur cette réservation',
    );
    this.name = 'RentalIssueNotAnswerableError';
  }
}
