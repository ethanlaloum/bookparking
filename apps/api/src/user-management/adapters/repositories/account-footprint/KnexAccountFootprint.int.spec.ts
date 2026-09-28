import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import {
  createKnexAccountFootprintSUT,
  LEA,
  MARC,
  PAUL,
} from './KnexAccountFootprint.sut';

const OCTOBER_10_TO_12 = { from: '2026-10-10', to: '2026-10-12' };
const OCTOBER_14_TO_15 = { from: '2026-10-14', to: '2026-10-15' };
const DURING_THE_RENTAL = new Date('2026-10-11T12:00:00.000Z');
const AFTER_THE_RENTAL = new Date('2026-10-20T12:00:00.000Z');

describe('KnexAccountFootprint', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('holds both parties of a request awaiting the owner', async () => {
    const sut = createKnexAccountFootprintSUT();
    await sut.givenActiveListingOf(MARC.id);
    const request = await sut.givenUnpaidRequest(
      LEA.id,
      MARC.id,
      OCTOBER_10_TO_12,
    );
    await sut.givenHoldPlaced(request);

    expect(await sut.whenCheckingCommitmentsAt(AFTER_THE_RENTAL)).toEqual({
      marc: true,
      lea: true,
      paul: false,
    });
  });

  it('holds both parties of a booking until its last instant', async () => {
    const sut = createKnexAccountFootprintSUT();
    await sut.givenActiveListingOf(MARC.id);
    const request = await sut.givenUnpaidRequest(
      LEA.id,
      MARC.id,
      OCTOBER_10_TO_12,
    );
    await sut.givenConfirmedAndCaptured(request);
    await sut.givenTransferRecorded(request, MARC.id);

    expect(await sut.whenCheckingCommitmentsAt(DURING_THE_RENTAL)).toEqual({
      marc: true,
      lea: true,
      paul: false,
    });
    expect(await sut.whenCheckingCommitmentsAt(AFTER_THE_RENTAL)).toEqual({
      marc: false,
      lea: false,
      paul: false,
    });
  });

  it('holds the owner until the money of a past booking is transferred', async () => {
    const sut = createKnexAccountFootprintSUT();
    await sut.givenActiveListingOf(MARC.id);
    const request = await sut.givenUnpaidRequest(
      LEA.id,
      MARC.id,
      OCTOBER_10_TO_12,
    );
    await sut.givenConfirmedAndCaptured(request);

    const beforeTransfer =
      await sut.whenCheckingCommitmentsAt(AFTER_THE_RENTAL);
    await sut.givenTransferRecorded(request, MARC.id);
    const afterTransfer = await sut.whenCheckingCommitmentsAt(AFTER_THE_RENTAL);

    expect(beforeTransfer).toEqual({ marc: true, lea: false, paul: false });
    expect(afterTransfer).toEqual({ marc: false, lea: false, paul: false });
  });

  it('holds no one for an unpaid request or a past booking without payment', async () => {
    const sut = createKnexAccountFootprintSUT();
    await sut.givenActiveListingOf(MARC.id);
    await sut.givenUnpaidRequest(LEA.id, MARC.id, OCTOBER_10_TO_12);
    const unpaidBooking = await sut.givenUnpaidRequest(
      LEA.id,
      MARC.id,
      OCTOBER_14_TO_15,
    );
    await sut.givenConfirmedBeforePayments(unpaidBooking);

    expect(await sut.whenCheckingCommitmentsAt(AFTER_THE_RENTAL)).toEqual({
      marc: false,
      lea: false,
      paul: false,
    });
  });

  it('erases what the account left, and only that', async () => {
    const sut = createKnexAccountFootprintSUT();
    const marcListing = await sut.givenActiveListingOf(MARC.id);
    const paulListing = await sut.givenActiveListingOf(PAUL.id);
    const leaOnMarc = await sut.givenUnpaidRequest(
      LEA.id,
      MARC.id,
      OCTOBER_10_TO_12,
    );
    const marcOnPaul = await sut.givenUnpaidRequest(
      MARC.id,
      PAUL.id,
      OCTOBER_10_TO_12,
    );
    const leaOnPaul = await sut.givenUnpaidRequest(
      LEA.id,
      PAUL.id,
      OCTOBER_14_TO_15,
    );
    await sut.givenNotificationFor(MARC.id, leaOnMarc);
    await sut.givenNotificationFor(LEA.id, leaOnPaul);
    await sut.givenPushDevice('ExponentPushToken[marc]', MARC.id);
    await sut.givenPushDevice('ExponentPushToken[lea]', LEA.id);
    await sut.givenEmailTo(MARC.email, 'SENT');
    await sut.givenEmailTo(MARC.email, 'PENDING');
    await sut.givenEmailTo(LEA.email, 'SENT');
    await sut.givenPayoutAccount(MARC.id);
    await sut.givenPayoutAccount(PAUL.id);

    await sut.whenErasing(MARC);

    await sut.thenRequestStatusesAre({
      [leaOnMarc]: 'ABANDONED',
      [marcOnPaul]: 'ABANDONED',
      [leaOnPaul]: 'AWAITING_PAYMENT',
    });
    await sut.thenListingStatusesAre({
      [marcListing]: 'UNPUBLISHED',
      [paulListing]: 'ACTIVE',
    });
    await sut.thenRemainingRowsAre({
      notificationRecipients: [LEA.id],
      pushTokens: ['ExponentPushToken[lea]'],
      emailRecipients: [LEA.email],
      payoutAccounts: [PAUL.id],
    });
  });
});
