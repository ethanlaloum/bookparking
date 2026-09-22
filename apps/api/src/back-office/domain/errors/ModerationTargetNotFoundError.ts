export class ModerationTargetNotFoundError extends Error {
  protected readonly _tag = 'ModerationTargetNotFoundError';
  constructor() {
    super("La cible de cette action n'existe pas");
  }
}
