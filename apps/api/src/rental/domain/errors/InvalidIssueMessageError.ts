const MESSAGES = {
  required: 'Décrivez le problème en quelques mots, 10 caractères au moins',
  tooLong: 'Le message ne peut pas dépasser 2 000 caractères',
} as const;

export class InvalidIssueMessageError extends Error {
  protected readonly _tag = 'InvalidIssueMessageError';
  constructor(kind: keyof typeof MESSAGES) {
    super(MESSAGES[kind]);
    this.name = 'InvalidIssueMessageError';
  }
}
