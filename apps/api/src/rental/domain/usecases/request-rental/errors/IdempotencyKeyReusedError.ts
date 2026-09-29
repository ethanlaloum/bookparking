export class IdempotencyKeyReusedError extends Error {
  protected readonly _tag = 'IdempotencyKeyReusedError';
  constructor() {
    super(
      'Cet identifiant de demande a déjà servi pour une autre place ou une autre période',
    );
    this.name = 'IdempotencyKeyReusedError';
  }
}
