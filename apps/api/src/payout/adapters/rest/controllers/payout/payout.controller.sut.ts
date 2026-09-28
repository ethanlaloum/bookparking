import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { OpenPayoutDashboard } from '../../../../domain/usecases/open-payout-dashboard/OpenPayoutDashboard';
import {
  PayoutSummary,
  ReadPayouts,
} from '../../../../domain/usecases/read-payouts/ReadPayouts';
import { StartPayoutOnboarding } from '../../../../domain/usecases/start-payout-onboarding/StartPayoutOnboarding';
import { PayoutController } from './payout.controller';

export const createPayoutControllerSUT = () => {
  const readPayouts = new UseCaseDouble<
    { accountId: string; now: Date },
    Either.Either<PayoutSummary, UnknownError>
  >();
  const startOnboarding = new UseCaseDouble<
    { accountId: string; now: Date },
    Either.Either<string, Error>
  >();
  const openDashboard = new UseCaseDouble<
    { accountId: string },
    Either.Either<string, Error>
  >();
  const authState: TestAuthState = { user: null };

  const metadata: ModuleMetadata = {
    controllers: [PayoutController],
    providers: [
      { provide: ReadPayouts, useValue: readPayouts },
      { provide: StartPayoutOnboarding, useValue: startOnboarding },
      { provide: OpenPayoutDashboard, useValue: openDashboard },
    ],
  };

  return {
    metadata,
    authState,
    readPayouts,
    startOnboarding,
    openDashboard,

    givenSignedInAs(accountId: string) {
      authState.user = { id: accountId };
    },
  };
};
