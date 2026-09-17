import { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';

export const createControllerTestApp = async (metadata: ModuleMetadata) => {
  const moduleRef = await Test.createTestingModule(metadata).compile();
  const app: INestApplication = moduleRef.createNestApplication({
    rawBody: true,
  });
  await app.init();

  return {
    app,
    close: () => app.close(),
  };
};
