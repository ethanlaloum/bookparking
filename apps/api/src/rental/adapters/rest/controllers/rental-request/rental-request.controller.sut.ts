import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { ConfirmRentalRequest } from '../../../../domain/usecases/confirm-rental-request/ConfirmRentalRequest';
import { RentalRequestExpiredError } from '../../../../domain/usecases/confirm-rental-request/errors/RentalRequestExpiredError';
import { RentalRequestNotFoundError } from '../../../../domain/usecases/confirm-rental-request/errors/RentalRequestNotFoundError';
import { RequestRental } from '../../../../domain/usecases/request-rental/RequestRental';
import { RentalRequestController } from './rental-request.controller';

export const LEA_ACCOUNT_ID = 'account-lea';
export const MARC_ACCOUNT_ID = 'account-marc';
export const A_REQUEST_ID = 'b9a1c2d3-1111-4111-8111-111111111111';

export const createRentalRequestControllerSUT = (authState: TestAuthState) => {
  const requestRental = new UseCaseDouble();
  const confirmRentalRequest = new UseCaseDouble<
    { requestId: string; ownerId: string; confirmedAt: Date },
    Either.Either<void, RentalRequestExpiredError | RentalRequestNotFoundError>
  >();

  const metadata: ModuleMetadata = {
    controllers: [RentalRequestController],
    providers: [
      { provide: RequestRental, useValue: requestRental },
      { provide: ConfirmRentalRequest, useValue: confirmRentalRequest },
    ],
  };

  return {
    metadata,
    authState,
    requestRental,
    confirmRentalRequest,

    givenConfirmationSucceeds() {
      confirmRentalRequest.willResolve(Either.right(undefined));
    },

    givenRequestHasExpired() {
      confirmRentalRequest.willResolve(
        Either.left(new RentalRequestExpiredError()),
      );
    },

    givenRequestIsUnknownToThisAccount() {
      confirmRentalRequest.willResolve(
        Either.left(new RentalRequestNotFoundError()),
      );
    },

    thenNoConfirmationWasAttempted() {
      expect(confirmRentalRequest.calls).toHaveLength(0);
    },

    thenConfirmationWasAttemptedBy(accountId: string) {
      expect(confirmRentalRequest.calls).toHaveLength(1);
      expect(confirmRentalRequest.lastCall?.ownerId).toEqual(accountId);
    },

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
