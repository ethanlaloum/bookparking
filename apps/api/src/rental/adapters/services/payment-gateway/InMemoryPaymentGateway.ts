import { PaymentUnavailableError } from '../../../domain/errors/PaymentUnavailableError';
import {
  CaptureOutcome,
  OpenedPaymentPage,
  PaymentGateway,
  PaymentPageRequest,
  ReleaseOutcome,
} from '../../../domain/ports/PaymentGateway';

interface MoneyCall {
  paymentId: string;
  idempotencyKey: string;
}

// Chaque tentative est notée avant l'échec simulé : c'est ce qui permet de
// vérifier qu'une opération rejouée après une panne porte la même clé.
interface MoneyAttempt extends MoneyCall {
  operation: 'capture' | 'release' | 'refund';
}

export class InMemoryPaymentGateway implements PaymentGateway {
  public unavailable = false;
  public openedPages: (PaymentPageRequest & { checkoutSessionId: string })[] =
    [];
  public closedPages: string[] = [];
  public captures: MoneyCall[] = [];
  public releases: MoneyCall[] = [];
  public refunds: MoneyCall[] = [];
  public attempts: MoneyAttempt[] = [];
  public declinedPaymentIds = new Set<string>();
  public capturedPaymentIds = new Set<string>();

  public async openPaymentPage(
    request: PaymentPageRequest,
  ): Promise<OpenedPaymentPage> {
    this.failWhenUnavailable();
    const checkoutSessionId = `cs_test_${request.requestId}`;
    this.openedPages.push({ ...request, checkoutSessionId });
    return {
      checkoutSessionId,
      checkoutUrl: `https://checkout.stripe.com/c/pay/${checkoutSessionId}`,
    };
  }

  public async closePaymentPage(checkoutSessionId: string): Promise<void> {
    this.failWhenUnavailable();
    this.closedPages.push(checkoutSessionId);
  }

  public async capture(
    paymentId: string,
    idempotencyKey: string,
  ): Promise<CaptureOutcome> {
    this.attempts.push({ operation: 'capture', paymentId, idempotencyKey });
    this.failWhenUnavailable();
    this.captures.push({ paymentId, idempotencyKey });
    if (this.declinedPaymentIds.has(paymentId)) return 'DECLINED';
    this.capturedPaymentIds.add(paymentId);
    return 'CAPTURED';
  }

  public async release(
    paymentId: string,
    idempotencyKey: string,
  ): Promise<ReleaseOutcome> {
    this.attempts.push({ operation: 'release', paymentId, idempotencyKey });
    this.failWhenUnavailable();
    this.releases.push({ paymentId, idempotencyKey });
    return this.capturedPaymentIds.has(paymentId)
      ? 'ALREADY_CAPTURED'
      : 'RELEASED';
  }

  public async refund(
    paymentId: string,
    idempotencyKey: string,
  ): Promise<{ refundId: string }> {
    this.attempts.push({ operation: 'refund', paymentId, idempotencyKey });
    this.failWhenUnavailable();
    this.refunds.push({ paymentId, idempotencyKey });
    return { refundId: `re_${paymentId}` };
  }

  private failWhenUnavailable(): void {
    if (this.unavailable) throw new PaymentUnavailableError();
  }
}
