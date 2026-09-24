export class RentalRequestAlreadyPaidError extends Error {
  protected readonly _tag = 'RentalRequestAlreadyPaidError';
  constructor() {
    super(
      "L'empreinte de cette demande est déjà posée : elle attend maintenant le propriétaire",
    );
    this.name = 'RentalRequestAlreadyPaidError';
  }
}
