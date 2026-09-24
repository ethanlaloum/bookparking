import {
  Controller,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Either } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { RecordPaymentEvent } from '../../../../domain/usecases/record-payment-event/RecordPaymentEvent';
import {
  InvalidWebhookSignatureError,
  StripeWebhookReader,
} from '../../../services/stripe-webhook/StripeWebhookReader';

// Aucune garde de jeton : c'est Stripe qui appelle, et seule la signature,
// vérifiée sur le corps brut, dit que l'événement vient de lui. Un corps relu
// après le décodage JSON ne porterait plus les mêmes octets et échouerait à
// la vérification — d'où `rawBody: true` à la création de l'application.
@Controller('payment')
export class PaymentWebhookController {
  constructor(
    private readonly recordPaymentEventUseCase: RecordPaymentEvent,
    private readonly webhookReader: StripeWebhookReader,
  ) {}

  @Post('stripe-webhook')
  @HttpCode(HttpStatus.OK)
  public async receive(
    @Req() req: { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: true } | undefined> {
    try {
      let event: ReturnType<StripeWebhookReader['read']>;
      try {
        event = this.webhookReader.read(req.rawBody, signature);
      } catch (error: unknown) {
        if (error instanceof InvalidWebhookSignatureError)
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        throw error;
      }
      if (event === null) return { received: true };

      const result = await this.recordPaymentEventUseCase.execute({
        ...event,
        receivedAt: new Date(),
      });
      if (Either.isLeft(result))
        throw new HttpException(
          "L'événement de paiement n'a pas pu être enregistré",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );

      return { received: true };
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'PaymentWebhookController',
        method: 'receive',
      });
    }
  }
}
