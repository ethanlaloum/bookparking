import { Either } from 'effect/index';

import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { InMemoryPaymentGateway } from '../../../adapters/services/payment-gateway/InMemoryPaymentGateway';
import { RentalRequest } from '../../entities/RentalRequest';
import { SweepRentalRequests } from './SweepRentalRequests';

const DAY_PRICE = { dayInCents: 1500, weekInCents: null, monthInCents: null };
const LEA_PAYMENT = 'pi_lea';

export const createSweepRentalRequestsSUT = () => {
  const rentalRepository = new InMemoryRentalRepository();
  const paymentGateway = new InMemoryPaymentGateway();
  const sweepRentalRequests = new SweepRentalRequests(
    rentalRepository,
    paymentGateway,
    48,
  );

  const context = { rentalRepository, paymentGateway, sweepRentalRequests };

  const arrange = async (requestedAt: string): Promise<string> => {
    const request = RentalRequest.request({
      renterId: 'account-lea',
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      days: { from: '2026-10-10', to: '2026-10-12' },
      pricing: DAY_PRICE,
      requestedAt: new Date(requestedAt),
    });
    if (Either.isLeft(request)) throw new Error('failed to arrange a request');
    await rentalRepository.createRequest(request.right);
    rentalRepository.ownerIdByRequestId.set(request.right.id, 'account-marc');
    return request.right.id;
  };

  return {
    context,

    async givenLeaRequestAwaitingPaymentSince(requestedAt: string) {
      return arrange(requestedAt);
    },

    async givenHoldPlacedAt(
      placedAt: string,
      requestedAt = '2026-10-01T07:00:00.000Z',
    ): Promise<string> {
      const id = await arrange(requestedAt);
      await rentalRepository.markHoldPlaced(
        id,
        LEA_PAYMENT,
        new Date(placedAt),
      );
      return id;
    },

    async givenConfirmedAt(requestId: string, confirmedAt: string) {
      paymentGateway.capturedPaymentIds.add(LEA_PAYMENT);
      await rentalRepository.confirmRequest(requestId, new Date(confirmedAt));
    },

    givenStripeCapturedWithoutTheDatabaseKnowing() {
      paymentGateway.capturedPaymentIds.add(LEA_PAYMENT);
    },

    givenCancelledByTheOperator(
      requestId: string,
      money: 'RELEASE_DUE' | 'REFUNDED',
    ) {
      rentalRepository.statusById.set(requestId, 'CANCELLED');
      rentalRepository.moneyById.set(requestId, money);
    },

    givenStripeDoesNotAnswer() {
      paymentGateway.unavailable = true;
    },

    givenStripeAnswersAgain() {
      paymentGateway.unavailable = false;
    },

    async whenSweepingAt(now: string) {
      return sweepRentalRequests.execute({ now: new Date(now) });
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenRequestStateIs(
      requestId: string,
      expected: { status: string; money: string },
    ) {
      expect({
        status: rentalRepository.statusOf(requestId),
        money: rentalRepository.moneyOf(requestId),
      }).toEqual(expected);
    },

    thenStatusIs(requestId: string, status: string) {
      expect(rentalRepository.statusOf(requestId)).toEqual(status);
    },

    thenReleasesAre(requestIds: string[]) {
      expect(paymentGateway.releases).toEqual(
        requestIds.map((id) => ({
          paymentId: LEA_PAYMENT,
          idempotencyKey: `release-${id}`,
        })),
      );
    },

    thenRefundsAre(requestIds: string[]) {
      expect(paymentGateway.refunds).toEqual(
        requestIds.map((id) => ({
          paymentId: LEA_PAYMENT,
          idempotencyKey: `refund-${id}`,
        })),
      );
    },

    thenReleaseAttemptKeysAre(keys: string[]) {
      expect(
        paymentGateway.attempts
          .filter((attempt) => attempt.operation === 'release')
          .map((attempt) => attempt.idempotencyKey),
      ).toEqual(keys);
    },

    thenStripeWasAskedNothing() {
      expect(paymentGateway.attempts).toEqual([]);
    },
  };
};
