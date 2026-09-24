import { Either } from 'effect/index';

import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { InMemoryPaymentGateway } from '../../../adapters/services/payment-gateway/InMemoryPaymentGateway';
import { RentalRequest } from '../../entities/RentalRequest';
import { ListOwnerRentalRequests } from '../list-owner-rental-requests/ListOwnerRentalRequests';
import { RecordPaymentEvent } from './RecordPaymentEvent';

const DAY_PRICE = { dayInCents: 1500, weekInCents: null, monthInCents: null };

export const createRecordPaymentEventSUT = () => {
  const rentalRepository = new InMemoryRentalRepository();
  const paymentGateway = new InMemoryPaymentGateway();
  const recordPaymentEvent = new RecordPaymentEvent(
    rentalRepository,
    paymentGateway,
  );
  const listOwnerRentalRequests = new ListOwnerRentalRequests(rentalRepository);

  const testConstants = {
    ownerId: 'account-marc',
    renterId: 'account-lea',
    requestedAt: new Date('2026-10-01T07:00:00.000Z'),
  };

  const context = {
    rentalRepository,
    paymentGateway,
    recordPaymentEvent,
    testConstants,
  };

  return {
    context,

    async givenLeaRequestAwaitingPayment(): Promise<string> {
      const request = RentalRequest.request({
        renterId: testConstants.renterId,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
        days: { from: '2026-10-10', to: '2026-10-12' },
        pricing: DAY_PRICE,
        requestedAt: testConstants.requestedAt,
      });
      if (Either.isLeft(request))
        throw new Error('failed to arrange a request awaiting payment');
      await rentalRepository.createRequest(request.right);
      rentalRepository.ownerIdByRequestId.set(
        request.right.id,
        testConstants.ownerId,
      );
      return request.right.id;
    },

    async givenRequestAbandoned(requestId: string) {
      await rentalRepository.markAbandoned(requestId);
    },

    async whenStripeReportsTheHold(params: {
      requestId: string;
      paymentId: string;
      at: string;
    }) {
      return recordPaymentEvent.execute({
        kind: 'HOLD_PLACED',
        requestId: params.requestId,
        paymentId: params.paymentId,
        placedAt: new Date(params.at),
        receivedAt: new Date(params.at),
      });
    },

    async whenStripeReportsThePagePastItsLife(requestId: string) {
      return recordPaymentEvent.execute({
        kind: 'PAYMENT_PAGE_EXPIRED',
        requestId,
        receivedAt: new Date('2026-10-01T07:30:00.000Z'),
      });
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

    thenHoldPlacedAt(requestId: string, at: string) {
      expect(rentalRepository.holdPlacedAtById.get(requestId)).toEqual(
        new Date(at),
      );
    },

    async thenTheOwnerSees(requestIds: string[]) {
      const result = await listOwnerRentalRequests.execute({
        ownerId: testConstants.ownerId,
      });
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result))
        expect(result.right.map((view) => view.id)).toEqual(requestIds);
    },

    thenReleasesAre(expected: { paymentId: string; idempotencyKey: string }[]) {
      expect(paymentGateway.releases).toEqual(expected);
    },
  };
};
