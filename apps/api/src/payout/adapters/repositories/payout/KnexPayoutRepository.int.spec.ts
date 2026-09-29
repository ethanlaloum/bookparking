import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexPayoutRepositorySUT } from './KnexPayoutRepository.sut';

const TEN_TO_TWELVE = { from: '2026-10-10', to: '2026-10-12' };
const TWENTY_TO_TWENTY_TWO = { from: '2026-10-20', to: '2026-10-22' };
// La location du 10/10 commence le 09/10 à 22:00 UTC : libérée le 10/10 à 22:00.
const A_DAY_AFTER_THE_START = '2026-10-10T22:00:00.000Z';

describe('KnexPayoutRepository', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('reads as due the captured money a day after the start, with the commission frozen on the request', async () => {
    const sut = createKnexPayoutRepositorySUT();
    const due = await sut.givenCapturedRental(TEN_TO_TWELVE);
    await sut.givenCapturedRental(TWENTY_TO_TWENTY_TWO);
    await sut.givenHeldRequest({ from: '2026-10-14', to: '2026-10-14' });

    const early = await sut.whenReadingDueAt('2026-10-10T21:59:59.000Z');
    const payable = await sut.whenReadingDueAt(A_DAY_AFTER_THE_START);

    expect(early).toEqual([]);
    expect(payable).toEqual([
      {
        requestId: due,
        ownerId: sut.marc,
        paymentId: `pi_${due}`,
        priceInCents: 4500,
        platformFeeInCents: 675,
        refundInCents: 0,
        account: null,
      },
    ]);
  });

  it('releases the money on the delay frozen on the request, not on the one in force', async () => {
    const sut = createKnexPayoutRepositorySUT();
    const slow = await sut.givenCapturedRental(TEN_TO_TWELVE, 72);

    const aDayAfter = await sut.whenReadingDueAt(A_DAY_AFTER_THE_START);
    const justBefore = await sut.whenReadingDueAt('2026-10-12T21:59:59.999Z');
    const threeDaysAfter = await sut.whenReadingDueAt(
      '2026-10-12T22:00:00.000Z',
    );

    expect(aDayAfter).toEqual([]);
    expect(justBefore).toEqual([]);
    expect(threeDaysAfter.map((payout) => payout.requestId)).toEqual([slow]);
    expect(
      (await sut.repository.findPayoutsForOwner(sut.marc)).map(
        (line) => line.releaseDelayInHours,
      ),
    ).toEqual([72]);
  });

  it('never reads as due the money frozen by an open report, and shows it held', async () => {
    const sut = createKnexPayoutRepositorySUT();
    const disputed = await sut.givenCapturedRental(TEN_TO_TWELVE);
    await sut.givenIssue(disputed, 'OPEN', null);

    const due = await sut.whenReadingDueAt('2026-10-20T08:00:00.000Z');
    const [line] = await sut.repository.findPayoutsForOwner(sut.marc);

    expect(due).toEqual([]);
    expect([line.disputed, line.refundInCents]).toEqual([true, 0]);
  });

  it('reads the refund granted to the driver with what is due', async () => {
    const sut = createKnexPayoutRepositorySUT();
    const refunded = await sut.givenCapturedRental(TEN_TO_TWELVE);
    await sut.givenIssue(refunded, 'PARTIALLY_REFUNDED', 1500);

    const [due] = await sut.whenReadingDueAt(A_DAY_AFTER_THE_START);
    const [line] = await sut.repository.findPayoutsForOwner(sut.marc);

    expect([due.requestId, due.refundInCents]).toEqual([refunded, 1500]);
    expect([line.disputed, line.refundInCents]).toEqual([false, 1500]);
  });

  it('reads as due at once the money of a rental whose renter has arrived', async () => {
    const sut = createKnexPayoutRepositorySUT();
    const arrived = await sut.givenCapturedRental(TWENTY_TO_TWENTY_TWO);
    await sut.givenArrived(arrived, '2026-10-20T08:00:00.000Z');

    const payable = await sut.whenReadingDueAt('2026-10-20T08:00:00.000Z');

    expect(payable.map((payout) => payout.requestId)).toEqual([arrived]);
  });

  it('no longer reads a rental once its transfer is recorded, and records it once', async () => {
    const sut = createKnexPayoutRepositorySUT();
    const due = await sut.givenCapturedRental(TEN_TO_TWELVE);
    const transfer = {
      requestId: due,
      ownerId: sut.marc,
      amountInCents: 3825,
      stripeTransferId: 'tr_1',
      transferredAt: new Date(A_DAY_AFTER_THE_START),
    };

    await sut.repository.recordTransfer(transfer);
    await sut.repository.recordTransfer({
      ...transfer,
      stripeTransferId: 'tr_2',
    });

    expect(await sut.whenReadingDueAt(A_DAY_AFTER_THE_START)).toEqual([]);
    const [line] = await sut.repository.findPayoutsForOwner(sut.marc);
    expect({
      transferredAmountInCents: line?.transferredAmountInCents,
      transferredAt: line?.transferredAt,
    }).toEqual({
      transferredAmountInCents: 3825,
      transferredAt: new Date(A_DAY_AFTER_THE_START),
    });
  });

  it('shows the owner his captured rentals only, with the place and the days', async () => {
    const sut = createKnexPayoutRepositorySUT();
    const captured = await sut.givenCapturedRental(TEN_TO_TWELVE);
    await sut.givenHeldRequest(TWENTY_TO_TWENTY_TWO);

    const lines = await sut.repository.findPayoutsForOwner(sut.marc);

    expect(lines).toEqual([
      {
        requestId: captured,
        address: '12 rue Barla, 06300 Nice',
        box: 'B12',
        fromDay: '2026-10-10',
        toDay: '2026-10-12',
        priceInCents: 4500,
        platformFeeInCents: 675,
        startsAt: new Date('2026-10-09T22:00:00.000Z'),
        arrivedAt: null,
        transferredAt: null,
        transferredAmountInCents: null,
        releaseDelayInHours: 24,
        disputed: false,
        refundInCents: 0,
      },
    ]);
    expect(await sut.repository.findPayoutsForOwner('account-paul')).toEqual(
      [],
    );
  });

  it('keeps one payout account per owner, and reads the address to prefill', async () => {
    const sut = createKnexPayoutRepositorySUT();
    const accountId = await sut.givenAccount('marc.d@example.com');
    const at = new Date('2026-10-01T09:00:00.000Z');

    await sut.repository.createAccount(
      { accountId, stripeAccountId: 'acct_first', payoutsEnabled: false },
      at,
    );
    await sut.repository.createAccount(
      { accountId, stripeAccountId: 'acct_second', payoutsEnabled: false },
      at,
    );
    await sut.repository.setPayoutsEnabled(accountId, true, at);

    expect(await sut.repository.findAccount(accountId)).toEqual({
      accountId,
      stripeAccountId: 'acct_first',
      payoutsEnabled: true,
    });
    expect(await sut.repository.findEmailOf(accountId)).toEqual(
      'marc.d@example.com',
    );
    expect(await sut.repository.findEmailOf('account-marc')).toBeNull();
  });

  it('joins the payout account of the owner to what is due', async () => {
    const sut = createKnexPayoutRepositorySUT();
    await sut.givenCapturedRental(TEN_TO_TWELVE);
    await sut.repository.createAccount(
      {
        accountId: sut.marc,
        stripeAccountId: 'acct_marc',
        payoutsEnabled: true,
      },
      new Date('2026-10-01T09:00:00.000Z'),
    );

    const [payable] = await sut.whenReadingDueAt(A_DAY_AFTER_THE_START);

    expect(payable?.account).toEqual({
      accountId: sut.marc,
      stripeAccountId: 'acct_marc',
      payoutsEnabled: true,
    });
  });
});
