import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { RegisterAccount } from '../../../../domain/usecases/register-account/RegisterAccount';
import { EmailAlreadyUsedError } from '../../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';
import { AccountController } from './account.controller';

export const createAccountControllerSUT = () => {
  const registerAccount = new UseCaseDouble();
  const authState: TestAuthState = { user: null };

  const metadata: ModuleMetadata = {
    controllers: [AccountController],
    providers: [{ provide: RegisterAccount, useValue: registerAccount }],
  };

  return {
    metadata,
    registerAccount,
    authState,

    givenAccountAlreadyExistsFor(email: string) {
      registerAccount.willResolve(Either.left(new EmailAlreadyUsedError()));
      return { email };
    },
  };
};
