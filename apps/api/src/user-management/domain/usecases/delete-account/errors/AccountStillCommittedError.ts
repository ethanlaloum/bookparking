export class AccountStillCommittedError extends Error {
  protected readonly _tag = 'AccountStillCommittedError';
  constructor() {
    super(
      "Une demande, une réservation ou un versement est encore en cours sur votre compte : vous pourrez le supprimer une fois qu'ils seront terminés",
    );
    this.name = 'AccountStillCommittedError';
  }
}
