export class InvalidCredentialsError extends Error {
  protected readonly _tag = 'InvalidCredentialsError';
  constructor() {
    super('Adresse e-mail ou mot de passe incorrect');
  }
}
