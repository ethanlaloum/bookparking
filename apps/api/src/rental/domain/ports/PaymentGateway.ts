export interface PaymentPageRequest {
  requestId: string;
  amountInCents: number;
  expiresAt: Date;
}

export interface OpenedPaymentPage {
  checkoutSessionId: string;
  checkoutUrl: string;
}

export type CaptureOutcome = 'CAPTURED' | 'DECLINED';

// `ALREADY_CAPTURED` n'est pas une erreur : un prélèvement a eu lieu chez
// Stripe sans que la base l'ait enregistré. Lever l'empreinte est alors
// impossible, et la demande doit être relue comme confirmée.
export type ReleaseOutcome = 'RELEASED' | 'ALREADY_CAPTURED';

// Toute méthode lève `PaymentUnavailableError` quand Stripe ne répond pas ;
// c'est le seul échec que le domaine distingue d'une erreur inattendue.
export interface PaymentGateway {
  openPaymentPage(request: PaymentPageRequest): Promise<OpenedPaymentPage>;
  closePaymentPage(checkoutSessionId: string): Promise<void>;
  capture(paymentId: string, idempotencyKey: string): Promise<CaptureOutcome>;
  release(paymentId: string, idempotencyKey: string): Promise<ReleaseOutcome>;
  refund(
    paymentId: string,
    idempotencyKey: string,
  ): Promise<{ refundId: string }>;
}
