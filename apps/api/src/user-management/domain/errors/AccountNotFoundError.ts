export class AccountNotFoundError extends Error {
  protected readonly _tag = 'AccountNotFoundError';
  constructor() {
    super("Ce compte n'existe plus");
  }
}
