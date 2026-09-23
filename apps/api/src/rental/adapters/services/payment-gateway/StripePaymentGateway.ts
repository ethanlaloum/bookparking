import { idempotencyKeyOf } from '../../../domain/entities/RentalMoney';
import { PaymentUnavailableError } from '../../../domain/errors/PaymentUnavailableError';
import { StripeClient, stripeErrors } from '../stripe/stripeSdk';
import {
  CaptureOutcome,
  OpenedPaymentPage,
  PaymentGateway,
  PaymentPageRequest,
  ReleaseOutcome,
} from '../../../domain/ports/PaymentGateway';

const toEpochSeconds = (date: Date): number => Math.ceil(date.getTime() / 1000);

// Stripe refuse une page qui expire moins de trente minutes après sa création,
// à la seconde près. L'échéance du domaine part de l'instant de la demande,
// quelques millisecondes plus tôt : envoyée telle quelle, elle serait refusée
// à chaque fois. Une minute de marge, et jamais moins que l'échéance voulue.
const STRIPE_MINIMUM_LIFETIME_IN_SECONDS = 31 * 60;

const isUnavailability = (error: unknown): boolean =>
  error instanceof stripeErrors.StripeConnectionError ||
  error instanceof stripeErrors.StripeAPIError ||
  error instanceof stripeErrors.StripeRateLimitError;

const isInvalidState = (error: unknown): boolean =>
  error instanceof stripeErrors.StripeInvalidRequestError ||
  error instanceof stripeErrors.StripeCardError;

export class StripePaymentGateway implements PaymentGateway {
  constructor(
    private readonly stripe: StripeClient,
    private readonly frontBaseUrl: string,
  ) {}

  public async openPaymentPage(
    request: PaymentPageRequest,
  ): Promise<OpenedPaymentPage> {
    const session = await this.call(() =>
      this.stripe.checkout.sessions.create(
        {
          mode: 'payment',
          locale: 'fr',
          payment_method_types: ['card'],
          client_reference_id: request.requestId,
          metadata: { requestId: request.requestId },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'eur',
                unit_amount: request.amountInCents,
                product_data: { name: 'Location d’une place de parking' },
              },
            },
          ],
          payment_intent_data: {
            capture_method: 'manual',
            metadata: { requestId: request.requestId },
          },
          expires_at: Math.max(
            toEpochSeconds(request.expiresAt),
            toEpochSeconds(new Date()) + STRIPE_MINIMUM_LIFETIME_IN_SECONDS,
          ),
          success_url: `${this.frontBaseUrl}/demande/${request.requestId}/paiement`,
          cancel_url: `${this.frontBaseUrl}/demande/${request.requestId}/paiement?abandon=1`,
        },
        { idempotencyKey: idempotencyKeyOf(request.requestId, 'checkout') },
      ),
    );
    if (!session.url)
      throw new Error("Stripe n'a rendu aucune adresse de page de paiement");
    return { checkoutSessionId: session.id, checkoutUrl: session.url };
  }

  // Une page déjà payée ou déjà expirée ne se ferme plus : ce n'est pas un
  // échec, il n'y a simplement plus rien à fermer.
  public async closePaymentPage(checkoutSessionId: string): Promise<void> {
    try {
      await this.call(() =>
        this.stripe.checkout.sessions.expire(checkoutSessionId),
      );
    } catch (error: unknown) {
      if (!isInvalidState(error)) throw error;
    }
  }

  public async capture(
    paymentId: string,
    idempotencyKey: string,
  ): Promise<CaptureOutcome> {
    try {
      await this.call(() =>
        this.stripe.paymentIntents.capture(paymentId, {}, { idempotencyKey }),
      );
      return 'CAPTURED';
    } catch (error: unknown) {
      if (!isInvalidState(error)) throw error;
      const status = await this.statusOf(paymentId);
      return status === 'succeeded' ? 'CAPTURED' : 'DECLINED';
    }
  }

  public async release(
    paymentId: string,
    idempotencyKey: string,
  ): Promise<ReleaseOutcome> {
    try {
      await this.call(() =>
        this.stripe.paymentIntents.cancel(paymentId, {}, { idempotencyKey }),
      );
      return 'RELEASED';
    } catch (error: unknown) {
      if (!isInvalidState(error)) throw error;
      const status = await this.statusOf(paymentId);
      if (status === 'succeeded') return 'ALREADY_CAPTURED';
      if (status === 'canceled') return 'RELEASED';
      throw error;
    }
  }

  public async refund(
    paymentId: string,
    idempotencyKey: string,
  ): Promise<{ refundId: string }> {
    const refund = await this.call(() =>
      this.stripe.refunds.create(
        { payment_intent: paymentId },
        { idempotencyKey },
      ),
    );
    return { refundId: refund.id };
  }

  private async statusOf(paymentId: string): Promise<string> {
    const intent = await this.call(() =>
      this.stripe.paymentIntents.retrieve(paymentId),
    );
    return intent.status;
  }

  private async call<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (isUnavailability(error)) throw new PaymentUnavailableError();
      throw error;
    }
  }
}
