export class InvalidPasswordResetTokenError extends Error {
  protected readonly _tag = 'InvalidPasswordResetTokenError';
  constructor() {
    super(
      "Ce lien de réinitialisation n'est plus valable. Demandez-en un nouveau.",
    );
  }
}
