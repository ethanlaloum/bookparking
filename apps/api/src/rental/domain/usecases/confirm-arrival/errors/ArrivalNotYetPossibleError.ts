export class ArrivalNotYetPossibleError extends Error {
  protected readonly _tag = 'ArrivalNotYetPossibleError';
  constructor() {
    super(
      "Vous pourrez confirmer votre arrivée à partir du premier jour d'une réservation confirmée",
    );
    this.name = 'ArrivalNotYetPossibleError';
  }
}
