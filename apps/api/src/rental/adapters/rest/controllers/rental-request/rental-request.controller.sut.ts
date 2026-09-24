import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { ConfirmRentalRequest } from '../../../../domain/usecases/confirm-rental-request/ConfirmRentalRequest';
import { RentalRequestExpiredError } from '../../../../domain/usecases/confirm-rental-request/errors/RentalRequestExpiredError';
import { RentalRequestNotFoundError } from '../../../../domain/errors/RentalRequestNotFoundError';
import { RentalRequest } from '../../../../domain/entities/RentalRequest';
import { AbandonRentalRequest } from '../../../../domain/usecases/abandon-rental-request/AbandonRentalRequest';
import { CancelRental } from '../../../../domain/usecases/cancel-rental/CancelRental';
import { RentalAlreadyStartedError } from '../../../../domain/usecases/cancel-rental/errors/RentalAlreadyStartedError';
import { ListOwnerRentalRequests } from '../../../../domain/usecases/list-owner-rental-requests/ListOwnerRentalRequests';
import { ListRenterRentalRequests } from '../../../../domain/usecases/list-renter-rental-requests/ListRenterRentalRequests';
import { RequestRental } from '../../../../domain/usecases/request-rental/RequestRental';
import { RentalRequestController } from './rental-request.controller';

export const LEA_ACCOUNT_ID = 'account-lea';
export const MARC_ACCOUNT_ID = 'account-marc';
export const A_REQUEST_ID = 'b9a1c2d3-1111-4111-8111-111111111111';
export const A_CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_lea';

const aRequestedRental = () => {
  const rentalRequest = RentalRequest.request({
    renterId: LEA_ACCOUNT_ID,
    address: '12 rue Barla, 06300 Nice',
    box: '12',
    days: { from: '2026-10-10', to: '2026-10-12' },
    pricing: { dayInCents: 1500, weekInCents: null, monthInCents: null },
    requestedAt: new Date('2026-10-01T07:00:00.000Z'),
  });
  if (Either.isLeft(rentalRequest))
    throw new Error('failed to arrange a requested rental');
  return {
    rentalRequest: rentalRequest.right,
    checkoutUrl: A_CHECKOUT_URL,
    replayed: false,
  };
};

export const createRentalRequestControllerSUT = (authState: TestAuthState) => {
  const requestRental = new UseCaseDouble();
  const confirmRentalRequest = new UseCaseDouble<
    { requestId: string; ownerId: string; confirmedAt: Date },
    Either.Either<void, RentalRequestExpiredError | RentalRequestNotFoundError>
  >();

  const abandonRentalRequest = new UseCaseDouble();
  const cancelRental = new UseCaseDouble<
    { requestId: string; accountId: string; cancelledAt: Date },
    Either.Either<string, Error>
  >();

  const metadata: ModuleMetadata = {
    controllers: [RentalRequestController],
    providers: [
      { provide: RequestRental, useValue: requestRental },
      { provide: ConfirmRentalRequest, useValue: confirmRentalRequest },
      { provide: ListRenterRentalRequests, useValue: new UseCaseDouble() },
      { provide: ListOwnerRentalRequests, useValue: new UseCaseDouble() },
      { provide: AbandonRentalRequest, useValue: abandonRentalRequest },
      { provide: CancelRental, useValue: cancelRental },
    ],
  };

  return {
    metadata,
    authState,
    requestRental,
    confirmRentalRequest,

    givenTheCancellationRefunds() {
      cancelRental.willResolve(Either.right('REFUNDED'));
    },

    givenTheRentalHasStarted() {
      cancelRental.willResolve(Either.left(new RentalAlreadyStartedError()));
    },

    thenTheCancellationWasAskedBy(accountId: string, requestId: string) {
      expect(cancelRental.calls).toEqual([
        { requestId, accountId, cancelledAt: expect.any(Date) },
      ]);
    },

    thenNoCancellationWasAsked() {
      expect(cancelRental.calls).toHaveLength(0);
    },

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
      const requested = aRequestedRental();
      requestRental.willResolve(Either.right(requested));
      return { requestId: requested.rentalRequest.id };
    },

    thenTheUseCaseReceivedOnly(expected: Record<string, unknown>) {
      expect(requestRental.calls).toEqual([expected]);
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
