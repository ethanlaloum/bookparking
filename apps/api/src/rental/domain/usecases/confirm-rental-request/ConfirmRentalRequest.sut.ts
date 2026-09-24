import { Either } from 'effect/index';

import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { InMemoryPaymentGateway } from '../../../adapters/services/payment-gateway/InMemoryPaymentGateway';
import { RentalRequest } from '../../entities/RentalRequest';
import { ConfirmRentalRequest } from './ConfirmRentalRequest';

const PRICING = { dayInCents: 1000, weekInCents: null, monthInCents: null };

export const createConfirmRentalRequestSUT = () => {
  const rentalRepository = new InMemoryRentalRepository();
  const paymentGateway = new InMemoryPaymentGateway();
  const confirmRentalRequest = new ConfirmRentalRequest(
    rentalRepository,
    paymentGateway,
  );

  const testConstants = {
    requestedAt: new Date('2026-10-01T07:00:00.000Z'),
    confirmedAt: new Date('2026-10-01T09:00:00.000Z'),
  };

  const context = {
    rentalRepository,
    paymentGateway,
    confirmRentalRequest,
    testConstants,
  };

  const arrangeRequest = async (params: {
    ownerId: string;
    renterId: string;
  }): Promise<string> => {
    const request = RentalRequest.request({
      renterId: params.renterId,
      address: '3 avenue Malausséna, 06000 Nice',
      box: 'box 4',
      days: { from: '2026-10-10', to: '2026-10-12' },
      pricing: PRICING,
      requestedAt: context.testConstants.requestedAt,
    });
    if (Either.isLeft(request))
      throw new Error('failed to arrange a pending request');

    await context.rentalRepository.createRequest(request.right);
    context.rentalRepository.ownerIdByRequestId.set(
      request.right.id,
      params.ownerId,
    );
    return request.right.id;
  };

  return {
    context,

    async givenPendingRequest(params: {
      ownerId: string;
      renterId: string;
    }): Promise<string> {
      const id = await arrangeRequest(params);
      context.rentalRepository.placeWithoutPayment(id);
      return id;
    },

    async givenRequestAwaitingPayment(params: {
      ownerId: string;
      renterId: string;
    }): Promise<string> {
      return arrangeRequest(params);
    },

    async givenHoldPlaced(params: {
      ownerId: string;
      renterId: string;
      paymentId: string;
      placedAt: string;
    }): Promise<string> {
      const id = await arrangeRequest(params);
      await context.rentalRepository.markHoldPlaced(
        id,
        params.paymentId,
        new Date(params.placedAt),
      );
      return id;
    },

    givenStripeDoesNotAnswer() {
      context.paymentGateway.unavailable = true;
    },

    givenTheBankDeclinesTheCapture(paymentId: string) {
      context.paymentGateway.declinedPaymentIds.add(paymentId);
    },

    async whenConfirmingAt(params: {
      requestId: string;
      ownerId: string;
      confirmedAt: string;
    }) {
      return context.confirmRentalRequest.execute({
        requestId: params.requestId,
        ownerId: params.ownerId,
        confirmedAt: new Date(params.confirmedAt),
      });
    },

    thenCapturesAre(expected: { paymentId: string; idempotencyKey: string }[]) {
      expect(context.paymentGateway.captures).toEqual(expected);
    },

    thenRequestStateIs(
      requestId: string,
      expected: { status: string; money: string },
    ) {
      expect({
        status: context.rentalRepository.statusOf(requestId),
        money: context.rentalRepository.moneyOf(requestId),
      }).toEqual(expected);
    },

    thenConfirmedAtIs(requestId: string, confirmedAt: string) {
      expect(
        context.rentalRepository.confirmations.filter(
          (confirmation) => confirmation.requestId === requestId,
        ),
      ).toEqual([{ requestId, confirmedAt: new Date(confirmedAt) }]);
    },

    givenRequestHasExpired(requestId: string) {
      context.rentalRepository.expiredRequestIds.add(requestId);
    },

    givenRequestAlreadyConfirmed(requestId: string) {
      context.rentalRepository.confirmedRequestIds.add(requestId);
    },

    async whenConfirming(params: { requestId: string; ownerId: string }) {
      return context.confirmRentalRequest.execute({
        requestId: params.requestId,
        ownerId: params.ownerId,
        confirmedAt: context.testConstants.confirmedAt,
      });
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenResultIsLeftWithError(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) expect(result.left).toBeInstanceOf(ErrorClass);
    },

    thenRequestIsConfirmed(requestId: string) {
      expect(
        context.rentalRepository.confirmedRequestIds.has(requestId),
      ).toEqual(true);
    },

    thenNothingWasConfirmed() {
      expect(context.rentalRepository.confirmations).toHaveLength(0);
    },

    thenConfirmationWasWrittenOnce(requestId: string) {
      const written = context.rentalRepository.confirmations.filter(
        (confirmation) => confirmation.requestId === requestId,
      );
      expect(written).toHaveLength(1);
      expect(written[0]?.confirmedAt).toEqual(
        context.testConstants.confirmedAt,
      );
    },

    thenRefusalsAreIndistinguishable(
      first: Either.Either<unknown, unknown>,
      second: Either.Either<unknown, unknown>,
    ) {
      expect(Either.isLeft(first)).toEqual(true);
      expect(Either.isLeft(second)).toEqual(true);
      if (!Either.isLeft(first) || !Either.isLeft(second)) return;
      const firstError = first.left as Error;
      const secondError = second.left as Error;
      expect(firstError.constructor).toEqual(secondError.constructor);
      expect(firstError.message).toEqual(secondError.message);
    },
  };
};
