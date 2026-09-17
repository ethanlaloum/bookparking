export class UnknownError extends Error {
  protected readonly _tag = 'UnknownError';
  constructor(cause?: string) {
    super(cause ? `Unexpected error: ${cause}` : 'Unexpected error');
  }
}
