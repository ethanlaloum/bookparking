import { Either } from 'effect/index';

import { PayoutAccountNotReadyError } from '../../errors/PayoutAccountNotReadyError';
import { PayoutUnavailableError } from '../../errors/PayoutUnavailableError';
import { createOwnerPayoutsSUT } from './ReadPayouts.sut';

const BEFORE_THE_START = '2026-10-05T09:00:00.000Z';
const TWO_DAYS_AFTER = '2026-10-11T22:00:00.000Z';

describe('ReadPayouts', () => {
  it('shows each paid rental with what the owner receives, and totals what is to come', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenAccount(true);
    sut.givenCapturedRental();
    const sent = sut.givenCapturedRental({
      priceInCents: 1500,
      platformFeeInCents: 225,
    });
    sut.givenTransferred(sent, 1275, '2026-10-10T22:05:00.000Z');

    const summary = await sut.whenReadingAt(BEFORE_THE_START);

    expect(summary.accountStatus).toEqual('READY');
    expect(
      summary.payouts.map((payout) => [payout.amountInCents, payout.status]),
    ).toEqual([
      [3825, 'HELD'],
      [1275, 'SENT'],
    ]);
    expect([
      summary.upcomingInCents,
      summary.sentInCents,
      summary.feePercent,
    ]).toEqual([3825, 1275, 15]);
  });

  it('tells an owner without bank details that released money waits for them', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenCapturedRental();

    const summary = await sut.whenReadingAt(TWO_DAYS_AFTER);

    expect(summary.accountStatus).toEqual('MISSING');
    expect(summary.payouts.map((payout) => payout.status)).toEqual([
      'AWAITING_ACCOUNT',
    ]);
  });

  it('releases on arrival before the delay runs out', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenAccount(true);
    sut.givenCapturedRental({
      arrivedAt: new Date('2026-10-10T08:00:00.000Z'),
    });

    const summary = await sut.whenReadingAt('2026-10-10T08:01:00.000Z');

    expect(
      summary.payouts.map((payout) => [
        payout.status,
        payout.releaseAt.toISOString(),
      ]),
    ).toEqual([['SENDING', '2026-10-10T08:00:00.000Z']]);
  });

  it('sees the owner back from Stripe as ready, without waiting for the sweep', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenAccount(false);
    sut.givenStripeHasSinceValidated();

    const summary = await sut.whenReadingAt(BEFORE_THE_START);

    expect(summary.accountStatus).toEqual('READY');
    sut.thenStoredAccountIs({
      stripeAccountId: 'acct_marc',
      payoutsEnabled: true,
    });
  });

  it('keeps the known state when Stripe does not answer', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenAccount(false);
    sut.givenStripeDoesNotAnswer();

    const summary = await sut.whenReadingAt(BEFORE_THE_START);

    expect(summary.accountStatus).toEqual('INCOMPLETE');
  });
});

describe('StartPayoutOnboarding', () => {
  it('creates one Stripe account, prefilled with the address of the account, and hands a link to Stripe', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenEmail(sut.marc, 'marc.d@example.com');

    const first = await sut.whenStartingOnboarding();
    const second = await sut.whenStartingOnboarding();

    sut.thenStripeAccountsCreatedAre([
      {
        accountId: sut.marc,
        email: 'marc.d@example.com',
        idempotencyKey: 'payout-account-account-marc',
      },
    ]);
    sut.thenStoredAccountIs({
      stripeAccountId: 'acct_account-marc',
      payoutsEnabled: false,
    });
    expect([first, second]).toEqual([
      Either.right('https://connect.stripe.com/setup/e/acct_account-marc'),
      Either.right('https://connect.stripe.com/setup/e/acct_account-marc'),
    ]);
  });

  it('says so when Stripe does not answer, and stores nothing', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenStripeDoesNotAnswer();

    const result = await sut.whenStartingOnboarding();

    expect(Either.isLeft(result) && result.left).toBeInstanceOf(
      PayoutUnavailableError,
    );
    sut.thenStoredAccountIs(null);
  });
});

describe('OpenPayoutDashboard', () => {
  it('opens the Stripe space of a validated account', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenAccount(true);

    expect(await sut.whenOpeningTheDashboard()).toEqual(
      Either.right('https://connect.stripe.com/express/acct_marc'),
    );
  });

  it('refuses before Stripe has validated the account', async () => {
    const sut = createOwnerPayoutsSUT();
    sut.givenAccount(false);

    const result = await sut.whenOpeningTheDashboard();

    expect(Either.isLeft(result) && result.left).toBeInstanceOf(
      PayoutAccountNotReadyError,
    );
  });
});
