export class MissingModerationReasonError extends Error {
  protected readonly _tag = 'MissingModerationReasonError';
  constructor() {
    super('Une action de modération exige un motif d’au moins 10 caractères');
  }
}
