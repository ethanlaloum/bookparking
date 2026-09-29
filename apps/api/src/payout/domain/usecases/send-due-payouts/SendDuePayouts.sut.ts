import { Either } from 'effect/index';

import { InMemoryPlatformSettingsReader } from '../../../../shared/platform-settings/adapters/repositories/InMemoryPlatformSettingsReader';
import { InMemoryNotificationOutbox } from '../../../../shared/notification-outbox/adapters/repositories/InMemoryNotificationOutbox';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import {
  InMemoryPayoutRepository,
  RentalForPayout,
} from '../../../adapters/repositories/payout/InMemoryPayoutRepository';
import { InMemoryPayoutProvider } from '../../../adapters/services/payout-provider/InMemoryPayoutProvider';
import { SendDuePayouts } from './SendDuePayouts';

const MARC = 'account-marc';

// La location du 10/10/2026 commence à 00:00, heure de Paris : 09/10 22:00 UTC.
const STARTS_AT = new Date('2026-10-09T22:00:00.000Z');

export const createSendDuePayoutsSUT = () => {
  const repository = new InMemoryPayoutRepository();
  const provider = new InMemoryPayoutProvider();
  const notificationOutbox = new InMemoryNotificationOutbox();
  const sendDuePayouts = new SendDuePayouts(
    repository,
    provider,
    notificationOutbox,
    new InMemoryUnitOfWork(),
    new InMemoryPlatformSettingsReader(),
  );
  let sequence = 0;

  return {
    marc: MARC,

    givenCapturedRental(overrides: Partial<RentalForPayout> = {}): string {
      sequence += 1;
      const requestId = overrides.requestId ?? `request-${sequence}`;
      repository.rentals.push({
        requestId,
        ownerId: MARC,
        paymentId: `pi_${sequence}`,
        captured: true,
        priceInCents: 4500,
        platformFeeInCents: 675,
        startsAt: STARTS_AT,
        arrivedAt: null,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
        fromDay: '2026-10-10',
        toDay: '2026-10-12',
        ...overrides,
      });
      return requestId;
    },

    givenReadyAccount(ownerId = MARC) {
      repository.accounts.set(ownerId, {
        accountId: ownerId,
        stripeAccountId: `acct_${ownerId}`,
        payoutsEnabled: true,
      });
    },

    givenIncompleteAccount(ownerId = MARC) {
      repository.accounts.set(ownerId, {
        accountId: ownerId,
        stripeAccountId: `acct_${ownerId}`,
        payoutsEnabled: false,
      });
    },

    givenStripeHasSinceValidated(ownerId = MARC) {
      provider.enabledStripeAccounts.add(`acct_${ownerId}`);
    },

    givenStripeDoesNotAnswer() {
      provider.unavailable = true;
    },

    givenStripeAnswersAgain() {
      provider.unavailable = false;
    },

    givenStripeRefusesTheTransferOf(paymentId: string) {
      provider.refusedPaymentIds.add(paymentId);
    },

    async whenSweepingAt(now: string) {
      const result = await sendDuePayouts.execute({ now: new Date(now) });
      if (Either.isLeft(result)) throw result.left;
      return result.right;
    },

    thenTransfersAre(
      expected: {
        stripeAccountId: string;
        amountInCents: number;
        idempotencyKey: string;
      }[],
    ) {
      expect(
        provider.transfers.map(
          ({ stripeAccountId, amountInCents, idempotencyKey }) => ({
            stripeAccountId,
            amountInCents,
            idempotencyKey,
          }),
        ),
      ).toEqual(expected);
    },

    thenRecordedTransfersAre(
      expected: { requestId: string; amountInCents: number }[],
    ) {
      expect(
        repository.transfers.map(({ requestId, amountInCents }) => ({
          requestId,
          amountInCents,
        })),
      ).toEqual(expected);
    },

    thenNotificationsAre(
      expected: { kind: string; recipientId: string; requestId: string }[],
    ) {
      expect(notificationOutbox.sent()).toEqual(expected);
    },

    thenAccountIsReady(ownerId = MARC) {
      expect(repository.accounts.get(ownerId)?.payoutsEnabled).toEqual(true);
    },
  };
};
