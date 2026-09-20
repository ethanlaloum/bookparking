export class EmailAlreadyUsedError extends Error {
  protected readonly _tag = 'EmailAlreadyUsedError';
  constructor() {
    super('Cette adresse e-mail est déjà utilisée');
  }
}
