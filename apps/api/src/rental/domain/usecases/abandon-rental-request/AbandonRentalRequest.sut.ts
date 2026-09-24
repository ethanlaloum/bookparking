import { Either } from 'effect/index';

import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { InMemoryPaymentGateway } from '../../../adapters/services/payment-gateway/InMemoryPaymentGateway';
import { RentalRequest } from '../../entities/RentalRequest';
import { AbandonRentalRequest } from './AbandonRentalRequest';

const DAY_PRICE = { dayInCents: 1500, weekInCents: null, monthInCents: null };

export const createAbandonRentalRequestSUT = () => {
  const rentalRepository = new InMemoryRentalRepository();
  const paymentGateway = new InMemoryPaymentGateway();
  const abandonRentalRequest = new AbandonRentalRequest(
    rentalRepository,
    paymentGateway,
  );

  const context = { rentalRepository, paymentGateway, abandonRentalRequest };

  return {
    context,

    async givenLeaRequestAwaitingPayment(params: {
      renterId: string;
      checkoutSessionId: string;
    }): Promise<string> {
      const request = RentalRequest.request({
        renterId: params.renterId,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
        days: { from: '2026-10-10', to: '2026-10-12' },
        pricing: DAY_PRICE,
        requestedAt: new Date('2026-10-01T07:00:00.000Z'),
      });
      if (Either.isLeft(request))
        throw new Error('failed to arrange a request awaiting payment');
      await rentalRepository.createRequest(request.right);
      rentalRepository.ownerIdByRequestId.set(request.right.id, 'account-marc');
      await rentalRepository.attachPaymentPage(
        request.right.id,
        params.checkoutSessionId,
      );
      return request.right.id;
    },

    async givenHoldPlaced(requestId: string) {
      await rentalRepository.markHoldPlaced(
        requestId,
        'pi_lea',
        new Date('2026-10-01T07:05:00.000Z'),
      );
    },

    async whenAbandonedBy(renterId: string, requestId: string) {
      return abandonRentalRequest.execute({ requestId, renterId });
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

    thenClosedPaymentPagesAre(checkoutSessionIds: string[]) {
      expect(paymentGateway.closedPages).toEqual(checkoutSessionIds);
    },

    thenStatusIs(requestId: string, status: string) {
      expect(rentalRepository.statusOf(requestId)).toEqual(status);
    },
  };
};
