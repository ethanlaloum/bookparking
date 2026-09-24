import { Either } from 'effect/index';

import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { InMemoryPaymentGateway } from '../../../adapters/services/payment-gateway/InMemoryPaymentGateway';
import { CancellationOutcome } from '../../entities/RentalCancellation';
import { RentalRequest } from '../../entities/RentalRequest';
import { CancelRental } from './CancelRental';

const MARC = 'account-marc';
const LEA = 'account-lea';
const LEA_PAYMENT = 'pi_lea';
const DAY_PRICE = { dayInCents: 1500, weekInCents: null, monthInCents: null };

export const createCancelRentalSUT = (
  options: { freeCancellationHoursNow?: number } = {},
) => {
  const rentalRepository = new InMemoryRentalRepository();
  const paymentGateway = new InMemoryPaymentGateway();
  const cancelRental = new CancelRental(
    rentalRepository,
    paymentGateway,
    options.freeCancellationHoursNow ?? 24,
  );

  const arrange = async (freeCancellationHours = 24): Promise<string> => {
    const request = RentalRequest.request({
      renterId: LEA,
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      days: { from: '2026-10-10', to: '2026-10-12' },
      pricing: DAY_PRICE,
      requestedAt: new Date('2026-10-01T07:00:00.000Z'),
      freeCancellationHours,
    });
    if (Either.isLeft(request)) throw new Error('arrange failed');
    await rentalRepository.createRequest(request.right);
    rentalRepository.ownerIdByRequestId.set(request.right.id, MARC);
    return request.right.id;
  };

  const placeHold = async (id: string) =>
    rentalRepository.markHoldPlaced(
      id,
      LEA_PAYMENT,
      new Date('2026-10-01T07:05:00.000Z'),
    );

  return {
    lea: LEA,
    marc: MARC,
    paul: 'account-paul',

    async givenLeaRequestAwaitingPayment(): Promise<string> {
      return arrange();
    },

    async givenLeaHoldPlaced(): Promise<string> {
      const id = await arrange();
      await placeHold(id);
      return id;
    },

    async givenLeaRentalConfirmed(
      freeCancellationHoursAtRequest = 24,
    ): Promise<string> {
      const id = await arrange(freeCancellationHoursAtRequest);
      await placeHold(id);
      await rentalRepository.confirmRequest(
        id,
        new Date('2026-10-01T16:00:00.000Z'),
      );
      return id;
    },

    async whenCancelledBy(accountId: string, requestId: string, at: string) {
      return cancelRental.execute({
        requestId,
        accountId,
        cancelledAt: new Date(at),
      });
    },

    thenOutcomeIs(
      result: Either.Either<CancellationOutcome, unknown>,
      expected: CancellationOutcome,
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) expect(result.right).toEqual(expected);
    },

    thenRefusedWith(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) expect(result.left).toBeInstanceOf(ErrorClass);
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

    thenRefundsAre(requestIds: string[]) {
      expect(paymentGateway.refunds).toEqual(
        requestIds.map((id) => ({
          paymentId: LEA_PAYMENT,
          idempotencyKey: `refund-${id}`,
        })),
      );
    },

    thenReleasesAre(requestIds: string[]) {
      expect(paymentGateway.releases).toEqual(
        requestIds.map((id) => ({
          paymentId: LEA_PAYMENT,
          idempotencyKey: `release-${id}`,
        })),
      );
    },
  };
};
