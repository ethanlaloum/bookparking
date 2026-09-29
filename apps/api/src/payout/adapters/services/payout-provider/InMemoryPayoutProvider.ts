import { PayoutUnavailableError } from '../../../domain/errors/PayoutUnavailableError';
import { PayoutProvider } from '../../../domain/ports/PayoutProvider';

// Stripe Connect en mémoire : les comptes créés, ceux que Stripe a validés, et
// chaque virement demandé, clé d'idempotence comprise.
export class InMemoryPayoutProvider implements PayoutProvider {
  public createdAccounts: {
    accountId: string;
    email: string | null;
    idempotencyKey: string;
  }[] = [];
  public enabledStripeAccounts = new Set<string>();
  public transfers: {
    stripeAccountId: string;
    amountInCents: number;
    paymentId: string;
    idempotencyKey: string;
  }[] = [];
  public refusedPaymentIds = new Set<string>();
  public unavailable = false;
  public statusChecks = 0;

  public async createAccount(params: {
    accountId: string;
    email: string | null;
    idempotencyKey: string;
  }): Promise<string> {
    this.failIfUnavailable();
    this.createdAccounts.push(params);
    return `acct_${params.accountId}`;
  }

  public async onboardingLink(stripeAccountId: string): Promise<string> {
    this.failIfUnavailable();
    return `https://connect.stripe.com/setup/e/${stripeAccountId}`;
  }

  public async dashboardLink(stripeAccountId: string): Promise<string> {
    this.failIfUnavailable();
    return `https://connect.stripe.com/express/${stripeAccountId}`;
  }

  public async payoutsEnabled(stripeAccountId: string): Promise<boolean> {
    this.failIfUnavailable();
    this.statusChecks += 1;
    return this.enabledStripeAccounts.has(stripeAccountId);
  }

  public async transfer(params: {
    stripeAccountId: string;
    amountInCents: number;
    paymentId: string;
    requestId: string;
    idempotencyKey: string;
  }): Promise<string> {
    this.failIfUnavailable();
    if (this.refusedPaymentIds.has(params.paymentId))
      throw new Error('Stripe refused the transfer');
    this.transfers.push({
      stripeAccountId: params.stripeAccountId,
      amountInCents: params.amountInCents,
      paymentId: params.paymentId,
      idempotencyKey: params.idempotencyKey,
    });
    return `tr_${params.requestId}`;
  }

  private failIfUnavailable(): void {
    if (this.unavailable) throw new PayoutUnavailableError();
  }
}
