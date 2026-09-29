import { Either } from 'effect/index';

import { InMemoryRentalIssueRepository } from '../../../adapters/repositories/rental-issue/InMemoryRentalIssueRepository';
import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { InMemoryPaymentGateway } from '../../../adapters/services/payment-gateway/InMemoryPaymentGateway';
import { InMemoryNotificationOutbox } from '../../../../shared/notification-outbox/adapters/repositories/InMemoryNotificationOutbox';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { RentalRequest } from '../../entities/RentalRequest';
import { SweepRentalRequests } from './SweepRentalRequests';

const DAY_PRICE = { dayInCents: 1500, weekInCents: null, monthInCents: null };
const LEA_PAYMENT = 'pi_lea';

export const createSweepRentalRequestsSUT = () => {
  const rentalRepository = new InMemoryRentalRepository();
  const paymentGateway = new InMemoryPaymentGateway();
  const notificationOutbox = new InMemoryNotificationOutbox();
  const rentalIssueRepository = new InMemoryRentalIssueRepository();
  const sweepRentalRequests = new SweepRentalRequests(
    rentalRepository,
    paymentGateway,
    notificationOutbox,
    new InMemoryUnitOfWork(),
    rentalIssueRepository,
  );

  const context = {
    rentalRepository,
    paymentGateway,
    sweepRentalRequests,
    rentalIssueRepository,
  };

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

    givenPartialRefundDecided(requestId: string, amountInCents: number) {
      rentalIssueRepository.givenRental({
        requestId,
        renterId: 'account-lea',
        ownerId: 'account-marc',
        status: 'CONFIRMED',
        money: 'CAPTURED',
        startsAt: new Date('2026-10-09T22:00:00.000Z'),
        endsAt: new Date('2026-10-12T21:59:59.999Z'),
        arrivedAt: null,
        transferred: false,
        paymentId: LEA_PAYMENT,
      });
      rentalIssueRepository.issues.set('issue-1', {
        id: 'issue-1',
        requestId,
        reason: 'PLACE_OCCUPIED',
        message: null,
        reportedAt: new Date('2026-10-10T08:00:00.000Z'),
        status: 'PARTIALLY_REFUNDED',
        ownerReply: null,
        ownerRepliedAt: null,
        refundInCents: amountInCents,
        resolvedAt: new Date('2026-10-10T10:00:00.000Z'),
      });
    },

    thenIssueRefundsAre(
      expected: {
        paymentId: string;
        idempotencyKey: string;
        amountInCents: number;
      }[],
    ) {
      expect(
        paymentGateway.refunds.filter(
          (refund) => refund.amountInCents !== undefined,
        ),
      ).toEqual(expected);
    },

    thenIssueRefundIdIs(expected: string | null) {
      expect(rentalIssueRepository.refunds.get('issue-1') ?? null).toEqual(
        expected,
      );
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

    thenNotificationsAre(
      expected: { kind: string; recipientId: string; requestId: string }[],
    ) {
      expect(notificationOutbox.sent()).toEqual(expected);
    },

    thenNotificationsWereCreatedAt(at: string[]) {
      expect(
        notificationOutbox.notifications.map(
          (notification) => notification.createdAt,
        ),
      ).toEqual(at.map((instant) => new Date(instant)));
    },

    thenReportIs(
      result: Either.Either<unknown, unknown>,
      expected: Record<string, number>,
    ) {
      expect(Either.isRight(result) ? result.right : result.left).toEqual(
        expected,
      );
    },

    thenStripeWasAskedNothing() {
      expect(paymentGateway.attempts).toEqual([]);
    },
  };
};
