import { Either } from 'effect/index';

import { InMemoryRentalIssueRepository } from '../../../adapters/repositories/rental-issue/InMemoryRentalIssueRepository';
import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { RentalRequest } from '../../entities/RentalRequest';
import { ConfirmArrival } from './ConfirmArrival';

const LEA = 'account-lea';

// La location du 10/10/2026 commence à 00:00, heure de Paris : 09/10 22:00 UTC.
export const createConfirmArrivalSUT = () => {
  const rentalRepository = new InMemoryRentalRepository();
  const rentalIssueRepository = new InMemoryRentalIssueRepository();
  const confirmArrival = new ConfirmArrival(
    rentalRepository,
    rentalIssueRepository,
  );

  const arrange = async (): Promise<string> => {
    const request = RentalRequest.request({
      renterId: LEA,
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      days: { from: '2026-10-10', to: '2026-10-12' },
      pricing: { dayInCents: 1500, weekInCents: null, monthInCents: null },
      requestedAt: new Date('2026-10-01T07:00:00.000Z'),
    });
    if (Either.isLeft(request)) throw new Error('arrange failed');
    await rentalRepository.createRequest(request.right);
    rentalRepository.ownerIdByRequestId.set(request.right.id, 'account-marc');
    rentalRepository.placeWithoutPayment(request.right.id);
    return request.right.id;
  };

  return {
    lea: LEA,

    async givenConfirmedRental(): Promise<string> {
      const id = await arrange();
      await rentalRepository.confirmRequest(
        id,
        new Date('2026-10-02T09:00:00.000Z'),
      );
      return id;
    },

    givenIssue(requestId: string, status: 'OPEN' | 'DISMISSED') {
      rentalIssueRepository.givenRental({
        requestId,
        renterId: LEA,
        ownerId: 'account-marc',
        status: 'CONFIRMED',
        money: 'CAPTURED',
        startsAt: new Date('2026-10-09T22:00:00.000Z'),
        endsAt: new Date('2026-10-12T21:59:59.999Z'),
        arrivedAt: null,
        transferred: false,
        paymentId: 'pi_lea',
      });
      rentalIssueRepository.issues.set('issue-1', {
        id: 'issue-1',
        requestId,
        reason: 'NO_ACCESS',
        message: null,
        reportedAt: new Date('2026-10-10T08:00:00.000Z'),
        status,
        ownerReply: null,
        ownerRepliedAt: null,
        refundInCents: null,
        resolvedAt:
          status === 'OPEN' ? null : new Date('2026-10-10T10:00:00.000Z'),
      });
    },

    async givenPendingRequest(): Promise<string> {
      return arrange();
    },

    async whenArrivingAs(accountId: string, requestId: string, at: string) {
      return confirmArrival.execute({
        requestId,
        renterId: accountId,
        arrivedAt: new Date(at),
      });
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenRefusedWith(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) expect(result.left).toBeInstanceOf(ErrorClass);
    },

    thenArrivedAtIs(requestId: string, expected: string | null) {
      expect(
        rentalRepository.arrivedAtById.get(requestId)?.toISOString() ?? null,
      ).toEqual(expected);
    },
  };
};
