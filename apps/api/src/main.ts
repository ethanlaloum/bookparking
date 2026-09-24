import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { environment } from './infra/config/environment';

async function bootstrap(): Promise<void> {
  environment.accessTokenSecret();
  environment.databaseUrl();
  environment.stripeSecretKey();
  environment.stripeWebhookSecret();
  environment.frontBaseUrl();
  environment.emailSending();

  // Le corps brut est gardé pour le webhook de Stripe, dont la signature porte
  // sur les octets reçus et non sur le JSON décodé.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  await app.listen(environment.port());
}

void bootstrap();
