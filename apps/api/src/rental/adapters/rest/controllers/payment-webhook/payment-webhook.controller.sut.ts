import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { RecordPaymentEvent } from '../../../../domain/usecases/record-payment-event/RecordPaymentEvent';
import { createStripeClient } from '../../../services/stripe/stripeSdk';
import { StripeWebhookReader } from '../../../services/stripe-webhook/StripeWebhookReader';
import { PaymentWebhookController } from './payment-webhook.controller';

export const WEBHOOK_SECRET = 'whsec_test_bookparking';
const ANOTHER_SECRET = 'whsec_test_somebody_else';
const LEA_REQUEST_ID = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const NOBODY_REQUEST_ID = '0a0b0c0d-0e0f-4a1b-8c2d-3e4f5a6b7c8d';

const stripe = createStripeClient('sk_test_signature_only');

const holdPlacedEventFor = (requestId: string): string =>
  JSON.stringify({
    id: 'evt_test_hold',
    object: 'event',
    type: 'payment_intent.amount_capturable_updated',
    created: 1790838300,
    data: {
      object: {
        id: 'pi_lea',
        object: 'payment_intent',
        metadata: { requestId },
      },
    },
  });

export const createPaymentWebhookControllerSUT = () => {
  const recordPaymentEvent = new UseCaseDouble<
    Record<string, unknown>,
    Either.Either<void, never>
  >();
  recordPaymentEvent.willResolve(Either.right(undefined));

  const metadata: ModuleMetadata = {
    controllers: [PaymentWebhookController],
    providers: [
      { provide: RecordPaymentEvent, useValue: recordPaymentEvent },
      {
        provide: StripeWebhookReader,
        useValue: new StripeWebhookReader(stripe, WEBHOOK_SECRET),
      },
    ],
  };

  const signed = (payload: string, secret: string) => ({
    payload,
    signature: stripe.webhooks.generateTestHeaderString({ payload, secret }),
  });

  return {
    metadata,
    leaHoldSignedWithAnotherSecret: () =>
      signed(holdPlacedEventFor(LEA_REQUEST_ID), ANOTHER_SECRET),
    holdForNobodySignedByStripe: () =>
      signed(holdPlacedEventFor(NOBODY_REQUEST_ID), WEBHOOK_SECRET),

    thenNothingWasRecorded() {
      expect(recordPaymentEvent.calls).toEqual([]);
    },

    thenRecordedExactly(expected: Record<string, unknown>) {
      expect(recordPaymentEvent.calls).toEqual([expected]);
    },

    nobodyRequestId: NOBODY_REQUEST_ID,
  };
};
