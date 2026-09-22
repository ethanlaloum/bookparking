import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { environment } from './infra/config/environment';

async function bootstrap(): Promise<void> {
  environment.accessTokenSecret();
  environment.databaseUrl();

  const app = await NestFactory.create(AppModule);
  await app.listen(environment.port());
}

void bootstrap();
