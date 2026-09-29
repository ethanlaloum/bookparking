const euros = (cents: number): string =>
  `${(cents / 100).toFixed(2).replace('.', ',')} €`;

export class InvalidRefundAmountError extends Error {
  protected readonly _tag = 'InvalidRefundAmountError';
  constructor(maximumInCents: number) {
    super(
      maximumInCents < 1
        ? 'La part du loueur ne permet pas de remboursement partiel : remboursez en totalité'
        : `Un remboursement partiel va de 0,01 € à ${euros(maximumInCents)}, pris sur la part du loueur`,
    );
  }
}
