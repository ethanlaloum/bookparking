import { createSendDuePayoutsSUT } from './SendDuePayouts.sut';

const ARRIVED = '2026-10-10T08:00:00.000Z';
const A_DAY_AFTER_THE_START = '2026-10-10T22:00:00.000Z';
const ONE_SECOND_BEFORE_A_DAY = '2026-10-10T21:59:59.000Z';

describe('SendDuePayouts', () => {
  it('pays the owner the price less the commission frozen on the request once the renter has arrived', async () => {
    const sut = createSendDuePayoutsSUT();
    sut.givenReadyAccount();
    const requestId = sut.givenCapturedRental({ arrivedAt: new Date(ARRIVED) });

    const report = await sut.whenSweepingAt(ARRIVED);

    // 45,00 € payés, 6,75 € de commission : 38,25 € virés.
    sut.thenTransfersAre([
      {
        stripeAccountId: 'acct_account-marc',
        amountInCents: 3825,
        idempotencyKey: `transfer-${requestId}`,
      },
    ]);
    sut.thenRecordedTransfersAre([{ requestId, amountInCents: 3825 }]);
    sut.thenNotificationsAre([
      { kind: 'RENTAL_PAYOUT_SENT', recipientId: sut.marc, requestId },
    ]);
    expect(report).toEqual({ sent: 1, awaitingAccount: 0, refused: 0 });
  });

  it('pays a day after the start without an arrival, and not one second before', async () => {
    const sut = createSendDuePayoutsSUT();
    sut.givenReadyAccount();
    const requestId = sut.givenCapturedRental();

    await sut.whenSweepingAt(ONE_SECOND_BEFORE_A_DAY);
    sut.thenRecordedTransfersAre([]);

    await sut.whenSweepingAt(A_DAY_AFTER_THE_START);
    sut.thenRecordedTransfersAre([{ requestId, amountInCents: 3825 }]);
  });

  it('pays a rental once, however many sweeps pass', async () => {
    const sut = createSendDuePayoutsSUT();
    sut.givenReadyAccount();
    sut.givenCapturedRental();
    await sut.whenSweepingAt(A_DAY_AFTER_THE_START);

    await sut.whenSweepingAt('2026-10-10T22:05:00.000Z');

    expect((await sut.whenSweepingAt('2026-10-10T22:10:00.000Z')).sent).toEqual(
      0,
    );
  });

  it('pays nothing of money that was refunded or never taken', async () => {
    const sut = createSendDuePayoutsSUT();
    sut.givenReadyAccount();
    sut.givenCapturedRental({ captured: false });

    await sut.whenSweepingAt(A_DAY_AFTER_THE_START);

    sut.thenTransfersAre([]);
  });

  it('keeps the money of an owner without bank details until Stripe validates them', async () => {
    const sut = createSendDuePayoutsSUT();
    const requestId = sut.givenCapturedRental();

    const withoutAccount = await sut.whenSweepingAt(A_DAY_AFTER_THE_START);
    sut.givenIncompleteAccount();
    const stillIncomplete = await sut.whenSweepingAt(
      '2026-10-10T22:05:00.000Z',
    );
    sut.givenStripeHasSinceValidated();
    const validated = await sut.whenSweepingAt('2026-10-10T22:10:00.000Z');

    expect([
      withoutAccount.awaitingAccount,
      stillIncomplete.awaitingAccount,
    ]).toEqual([1, 1]);
    expect(validated.sent).toEqual(1);
    sut.thenAccountIsReady();
    sut.thenRecordedTransfersAre([{ requestId, amountInCents: 3825 }]);
  });

  it('takes the commission in force for a request that froze none', async () => {
    const sut = createSendDuePayoutsSUT();
    sut.givenReadyAccount();
    const requestId = sut.givenCapturedRental({
      priceInCents: 1999,
      platformFeeInCents: null,
    });

    await sut.whenSweepingAt(A_DAY_AFTER_THE_START);

    // 15 % de 19,99 € = 3,00 € au centime près : 16,99 € virés.
    sut.thenRecordedTransfersAre([{ requestId, amountInCents: 1699 }]);
  });

  it('records nothing while Stripe does not answer, and pays at the next sweep', async () => {
    const sut = createSendDuePayoutsSUT();
    sut.givenReadyAccount();
    const requestId = sut.givenCapturedRental();
    sut.givenStripeDoesNotAnswer();

    await sut.whenSweepingAt(A_DAY_AFTER_THE_START);
    sut.thenRecordedTransfersAre([]);
    sut.givenStripeAnswersAgain();
    await sut.whenSweepingAt('2026-10-10T22:05:00.000Z');

    sut.thenRecordedTransfersAre([{ requestId, amountInCents: 3825 }]);
  });

  it('still pays the other rentals when Stripe refuses one transfer', async () => {
    const sut = createSendDuePayoutsSUT();
    sut.givenReadyAccount();
    sut.givenCapturedRental({ paymentId: 'pi_refused' });
    const paid = sut.givenCapturedRental({ paymentId: 'pi_fine' });
    sut.givenStripeRefusesTheTransferOf('pi_refused');

    const report = await sut.whenSweepingAt(A_DAY_AFTER_THE_START);

    expect(report).toEqual({ sent: 1, awaitingAccount: 0, refused: 1 });
    sut.thenRecordedTransfersAre([{ requestId: paid, amountInCents: 3825 }]);
  });
});
