import { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AuthGuard } from '../../../user-management/adapters/rest/guards/auth.guard';
import { OptionalAuthGuard } from '../../../user-management/adapters/rest/guards/optional-auth.guard';
import { TestAuthGuard, TestAuthState } from './TestAuthGuard';
import { TestOptionalAuthGuard } from './TestOptionalAuthGuard';

export const createControllerTestApp = async (
  metadata: ModuleMetadata,
  authState: TestAuthState = { user: null },
) => {
  const moduleRef = await Test.createTestingModule(metadata)
    .overrideGuard(AuthGuard)
    .useValue(new TestAuthGuard(authState))
    .overrideGuard(OptionalAuthGuard)
    .useValue(new TestOptionalAuthGuard(authState))
    .compile();
  const app: INestApplication = moduleRef.createNestApplication({
    rawBody: true,
  });
  await app.init();

  return {
    app,
    close: () => app.close(),
  };
};
