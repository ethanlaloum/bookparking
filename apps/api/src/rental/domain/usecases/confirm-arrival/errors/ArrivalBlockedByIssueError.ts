export class ArrivalBlockedByIssueError extends Error {
  protected readonly _tag = 'ArrivalBlockedByIssueError';
  constructor() {
    super(
      'Votre réclamation est en cours d’examen : l’arrivée ne peut pas être confirmée d’ici là',
    );
    this.name = 'ArrivalBlockedByIssueError';
  }
}
