import { Either } from 'effect/index';

import {
  InMemoryPayoutRepository,
  RentalForPayout,
} from '../../../adapters/repositories/payout/InMemoryPayoutRepository';
import { InMemoryPayoutProvider } from '../../../adapters/services/payout-provider/InMemoryPayoutProvider';
import { OpenPayoutDashboard } from '../open-payout-dashboard/OpenPayoutDashboard';
import { StartPayoutOnboarding } from '../start-payout-onboarding/StartPayoutOnboarding';
import { PayoutSummary, ReadPayouts } from './ReadPayouts';

const MARC = 'account-marc';
const STARTS_AT = new Date('2026-10-09T22:00:00.000Z');

// Les trois cas d'usage que le loueur déclenche depuis « Versements ».
export const createOwnerPayoutsSUT = () => {
  const repository = new InMemoryPayoutRepository();
  const provider = new InMemoryPayoutProvider();
  const readPayouts = new ReadPayouts(repository, provider, 24, 15);
  const startOnboarding = new StartPayoutOnboarding(repository, provider);
  const openDashboard = new OpenPayoutDashboard(repository, provider);
  let sequence = 0;

  return {
    marc: MARC,

    givenEmail(accountId: string, email: string) {
      repository.emails.set(accountId, email);
    },

    givenCapturedRental(overrides: Partial<RentalForPayout> = {}): string {
      sequence += 1;
      const requestId = `request-${sequence}`;
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

    givenTransferred(requestId: string, amountInCents: number, at: string) {
      repository.transfers.push({
        requestId,
        ownerId: MARC,
        amountInCents,
        stripeTransferId: `tr_${requestId}`,
        transferredAt: new Date(at),
      });
    },

    givenAccount(payoutsEnabled: boolean) {
      repository.accounts.set(MARC, {
        accountId: MARC,
        stripeAccountId: 'acct_marc',
        payoutsEnabled,
      });
    },

    givenStripeHasSinceValidated() {
      provider.enabledStripeAccounts.add('acct_marc');
    },

    givenStripeDoesNotAnswer() {
      provider.unavailable = true;
    },

    async whenReadingAt(now: string): Promise<PayoutSummary> {
      const result = await readPayouts.execute({
        accountId: MARC,
        now: new Date(now),
      });
      if (Either.isLeft(result)) throw result.left;
      return result.right;
    },

    async whenStartingOnboarding() {
      return startOnboarding.execute({
        accountId: MARC,
        now: new Date('2026-10-01T09:00:00.000Z'),
      });
    },

    async whenOpeningTheDashboard() {
      return openDashboard.execute({ accountId: MARC });
    },

    thenStripeAccountsCreatedAre(
      expected: {
        accountId: string;
        email: string | null;
        idempotencyKey: string;
      }[],
    ) {
      expect(provider.createdAccounts).toEqual(expected);
    },

    thenStoredAccountIs(
      expected: { stripeAccountId: string; payoutsEnabled: boolean } | null,
    ) {
      const account = repository.accounts.get(MARC);
      expect(
        account === undefined
          ? null
          : {
              stripeAccountId: account.stripeAccountId,
              payoutsEnabled: account.payoutsEnabled,
            },
      ).toEqual(expected);
    },
  };
};
