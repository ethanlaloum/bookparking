import { Either, Schema } from 'effect/index';

import { PaymentEvent } from '../../../domain/usecases/record-payment-event/RecordPaymentEvent';
import {
  StripeCheckoutSession,
  StripeClient,
  StripeEvent,
  StripePaymentIntent,
} from '../stripe/stripeSdk';

export class InvalidWebhookSignatureError extends Error {
  protected readonly _tag = 'InvalidWebhookSignatureError';
  constructor() {
    super('Signature du webhook invalide');
    this.name = 'InvalidWebhookSignatureError';
  }
}

const HOLD_PLACED = 'payment_intent.amount_capturable_updated';
const PAYMENT_PAGE_EXPIRED = 'checkout.session.expired';

// Un identifiant de demande qui n'est pas un UUID ne désigne aucune demande :
// le passer au dépôt ferait échouer la requête SQL, donc répondre 500, et
// Stripe renverrait l'événement pendant trois jours.
const asRequestId = (value: unknown): string | null => {
  const decoded = Schema.decodeUnknownEither(Schema.UUID)(value);
  return Either.isRight(decoded) ? decoded.right : null;
};

export class StripeWebhookReader {
  constructor(
    private readonly stripe: StripeClient,
    private readonly webhookSecret: string,
  ) {}

  public read(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): PaymentEvent | null {
    if (rawBody === undefined || signature === undefined)
      throw new InvalidWebhookSignatureError();

    let event: StripeEvent;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch {
      throw new InvalidWebhookSignatureError();
    }

    if (event.type === HOLD_PLACED) {
      const intent = event.data.object as StripePaymentIntent;
      const requestId = asRequestId(intent.metadata?.requestId);
      if (requestId === null) return null;
      return {
        kind: 'HOLD_PLACED',
        requestId,
        paymentId: intent.id,
        placedAt: new Date(event.created * 1000),
      };
    }

    if (event.type === PAYMENT_PAGE_EXPIRED) {
      const session = event.data.object as StripeCheckoutSession;
      const requestId = asRequestId(
        session.client_reference_id ?? session.metadata?.requestId,
      );
      if (requestId === null) return null;
      return { kind: 'PAYMENT_PAGE_EXPIRED', requestId };
    }

    return null;
  }
}
