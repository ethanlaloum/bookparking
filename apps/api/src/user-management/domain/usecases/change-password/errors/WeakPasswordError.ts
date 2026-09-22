export class WeakPasswordError extends Error {
  protected readonly _tag = 'WeakPasswordError';
  constructor() {
    super('Le mot de passe doit contenir au moins 8 caractères');
  }
}
