// Levée par le dépôt quand deux écritures simultanées portent le même
// identifiant d'intention pour le même compte : la seconde rejoue la première.
export class DuplicateIdempotencyKeyError extends Error {
  protected readonly _tag = 'DuplicateIdempotencyKeyError';
  constructor() {
    super("Une demande existe déjà sous cet identifiant d'intention");
    this.name = 'DuplicateIdempotencyKeyError';
  }
}
