import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { RequestRental } from '../../../../domain/usecases/request-rental/RequestRental';
import { RentalRequestController } from './rental-request.controller';

export const LEA_ACCOUNT_ID = 'account-lea';
export const MARC_ACCOUNT_ID = 'account-marc';

export const createRentalRequestControllerSUT = (authState: TestAuthState) => {
  const requestRental = new UseCaseDouble();

  const metadata: ModuleMetadata = {
    controllers: [RentalRequestController],
    providers: [{ provide: RequestRental, useValue: requestRental }],
  };

  return {
    metadata,
    authState,
    requestRental,

    givenRentalRequestSucceeds() {
      requestRental.willResolve(Either.right(undefined));
    },

    thenNoRentalRequestWasMade() {
      expect(requestRental.calls).toHaveLength(0);
    },

    thenRentalRequestWasMadeFor(accountId: string) {
      expect(requestRental.calls).toHaveLength(1);
      expect((requestRental.calls[0] as { renterId: string }).renterId).toEqual(
        accountId,
      );
    },

    thenBodyRenterIdWasIgnored(bodyRenterId: string) {
      expect(
        (requestRental.calls[0] as { renterId: string }).renterId,
      ).not.toEqual(bodyRenterId);
    },
  };
};
