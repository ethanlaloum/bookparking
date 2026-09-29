// Stripe Connect, vu du domaine. Toute méthode lève `PayoutUnavailableError`
// quand le service ne répond pas ; c'est le seul échec que le domaine
// distingue d'une erreur inattendue.
export interface PayoutProvider {
  createAccount(params: {
    accountId: string;
    email: string | null;
    idempotencyKey: string;
  }): Promise<string>;
  onboardingLink(stripeAccountId: string): Promise<string>;
  dashboardLink(stripeAccountId: string): Promise<string>;
  payoutsEnabled(stripeAccountId: string): Promise<boolean>;
  transfer(params: {
    stripeAccountId: string;
    amountInCents: number;
    paymentId: string;
    requestId: string;
    idempotencyKey: string;
  }): Promise<string>;
}
