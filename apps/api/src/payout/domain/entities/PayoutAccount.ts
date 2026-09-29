// Le compte Stripe Connect Express d'un loueur. Son identité et son IBAN sont
// saisis chez Stripe et n'y restent : Bookparking ne garde que l'identifiant
// du compte, et si Stripe l'autorise à recevoir des virements.
export interface PayoutAccount {
  accountId: string;
  stripeAccountId: string;
  payoutsEnabled: boolean;
}

export type PayoutAccountStatus = 'MISSING' | 'INCOMPLETE' | 'READY';

export const payoutAccountStatusOf = (
  account: PayoutAccount | null,
): PayoutAccountStatus => {
  if (account === null) return 'MISSING';
  return account.payoutsEnabled ? 'READY' : 'INCOMPLETE';
};
