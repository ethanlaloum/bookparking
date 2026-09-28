import { describe, it } from 'vitest';

import { createPayoutsSut } from './payouts.sut';

describe('the payouts of an owner', () => {
  it('shows what the api holds', () => {
    const sut = createPayoutsSut();
    const summary = {
      accountStatus: 'READY' as const,
      feePercent: 15,
      upcomingInCents: 3825,
      sentInCents: 0,
      payouts: [sut.aPayoutLine()],
    };
    sut.givenTheApiHolds(summary);

    sut.whenReading();

    sut.thenTheSummaryShownIs(summary);
  });

  it('says money waits when released or held payouts have no bank details to go to', () => {
    const sut = createPayoutsSut();
    sut.givenTheApiHolds({ accountStatus: 'MISSING', payouts: [sut.aPayoutLine({ status: 'AWAITING_ACCOUNT' })] });

    sut.whenReading();

    sut.thenMoneyWaitsForBankDetails(true);
  });

  it('says nothing waits once Stripe accepts payouts, or when nothing is owed', () => {
    const ready = createPayoutsSut();
    ready.givenTheApiHolds({ accountStatus: 'READY', payouts: [ready.aPayoutLine()] });
    ready.whenReading();
    ready.thenMoneyWaitsForBankDetails(false);

    const nothing = createPayoutsSut();
    nothing.givenTheApiHolds({ accountStatus: 'MISSING', payouts: [nothing.aPayoutLine({ status: 'SENT' })] });
    nothing.whenReading();
    nothing.thenMoneyWaitsForBankDetails(false);
  });

  it('opens the Stripe page the api hands, never a page of its own', () => {
    const sut = createPayoutsSut();

    sut.whenOpening('onboarding');
    sut.whenOpening('dashboard');

    sut.thenTheStripePagesOpenedAre([
      'https://connect.stripe.com/setup/e/acct_marc',
      'https://connect.stripe.com/express/acct_marc',
    ]);
  });

  it('opens nothing and says why when Stripe does not answer', () => {
    const sut = createPayoutsSut();
    sut.givenTheApiRejectsWith('Le service de versement ne répond pas pour le moment.');

    sut.whenOpening('onboarding');

    sut.thenTheStripePagesOpenedAre([]);
    sut.thenTheStripeErrorShownIs('Le service de versement ne répond pas pour le moment.');
  });

  it('forgets the payouts on sign-out', () => {
    const sut = createPayoutsSut();
    sut.givenTheApiHolds({ accountStatus: 'READY' });
    sut.whenReading();

    sut.whenSigningOut();

    sut.thenTheSummaryShownIs(null);
  });
});
