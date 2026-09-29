export class InvalidStayError extends Error {
  protected readonly _tag = 'InvalidStayError';
  constructor() {
    super('Les dates recherchées sont invalides');
  }
}
