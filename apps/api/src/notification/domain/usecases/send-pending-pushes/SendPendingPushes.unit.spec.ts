import { createSendPendingPushesSUT } from './SendPendingPushes.sut';

const MARC = 'account-marc';
const LEA = 'account-lea';
const MARC_IPHONE = 'ExponentPushToken[marc-iphone]';
const MARC_IPAD = 'ExponentPushToken[marc-ipad]';
const LEA_IPHONE = 'ExponentPushToken[lea-iphone]';

describe('SendPendingPushes', () => {
  it('pushes a notification to every phone of its recipient, and says where it leads', async () => {
    const sut = createSendPendingPushesSUT();
    sut.givenPhone(MARC, MARC_IPHONE);
    sut.givenPhone(MARC, MARC_IPAD);
    sut.givenPhone(LEA, LEA_IPHONE);
    const received = sut.givenNotification({
      recipientId: MARC,
      kind: 'RENTAL_REQUEST_RECEIVED',
      audience: 'OWNER',
      createdAt: '2026-10-01T07:05:00.000Z',
    });

    const report = await sut.whenSweepingAt('2026-10-01T07:05:10.000Z');

    sut.thenExpoReceived([
      {
        to: MARC_IPHONE,
        title: 'Nouvelle demande de réservation',
        data: { notificationId: received, destination: 'received' },
      },
      {
        to: MARC_IPAD,
        title: 'Nouvelle demande de réservation',
        data: { notificationId: received, destination: 'received' },
      },
    ]);
    expect(report).toEqual({ pushed: 2, skipped: 0, forgotten: 0 });
  });

  it('leads the renter to her bookings', async () => {
    const sut = createSendPendingPushesSUT();
    sut.givenPhone(LEA, LEA_IPHONE);
    const accepted = sut.givenNotification({
      recipientId: LEA,
      kind: 'RENTAL_REQUEST_ACCEPTED',
      audience: 'RENTER',
      createdAt: '2026-10-01T09:00:00.000Z',
    });

    await sut.whenSweepingAt('2026-10-01T09:00:10.000Z');

    sut.thenExpoReceived([
      {
        to: LEA_IPHONE,
        title: 'Votre réservation est confirmée',
        data: { notificationId: accepted, destination: 'mine' },
      },
    ]);
  });

  it('pushes a notification once, however many sweeps pass', async () => {
    const sut = createSendPendingPushesSUT();
    sut.givenPhone(MARC, MARC_IPHONE);
    const received = sut.givenNotification({
      recipientId: MARC,
      kind: 'RENTAL_REQUEST_RECEIVED',
      audience: 'OWNER',
      createdAt: '2026-10-01T07:05:00.000Z',
    });
    await sut.whenSweepingAt('2026-10-01T07:05:10.000Z');

    await sut.whenSweepingAt('2026-10-01T07:05:20.000Z');

    sut.thenPushedAtAre({ [received]: '2026-10-01T07:05:10.000Z' });
    sut.thenExpoReceived([
      {
        to: MARC_IPHONE,
        title: 'Nouvelle demande de réservation',
        data: { notificationId: received, destination: 'received' },
      },
    ]);
  });

  it('closes a notification whose recipient has no phone, without calling Expo', async () => {
    const sut = createSendPendingPushesSUT();
    const received = sut.givenNotification({
      recipientId: MARC,
      kind: 'RENTAL_REQUEST_RECEIVED',
      audience: 'OWNER',
      createdAt: '2026-10-01T07:05:00.000Z',
    });

    await sut.whenSweepingAt('2026-10-01T07:05:10.000Z');

    sut.thenNothingWasPushed();
    sut.thenPushedAtAre({ [received]: '2026-10-01T07:05:10.000Z' });
  });

  it('pushes nothing an hour late, and closes the notification', async () => {
    const sut = createSendPendingPushesSUT();
    sut.givenPhone(MARC, MARC_IPHONE);
    const stale = sut.givenNotification({
      recipientId: MARC,
      kind: 'RENTAL_REQUEST_RECEIVED',
      audience: 'OWNER',
      createdAt: '2026-10-01T07:05:00.000Z',
    });

    const report = await sut.whenSweepingAt('2026-10-01T08:05:00.000Z');

    sut.thenNothingWasPushed();
    sut.thenPushedAtAre({ [stale]: '2026-10-01T08:05:00.000Z' });
    expect(report).toEqual({ pushed: 0, skipped: 1, forgotten: 0 });
  });

  it('still pushes one second before the hour', async () => {
    const sut = createSendPendingPushesSUT();
    sut.givenPhone(MARC, MARC_IPHONE);
    sut.givenNotification({
      recipientId: MARC,
      kind: 'RENTAL_REQUEST_RECEIVED',
      audience: 'OWNER',
      createdAt: '2026-10-01T07:05:00.000Z',
    });

    const report = await sut.whenSweepingAt('2026-10-01T08:04:59.000Z');

    expect(report.pushed).toEqual(1);
  });

  it('keeps a notification for the next sweep when Expo does not answer', async () => {
    const sut = createSendPendingPushesSUT();
    sut.givenPhone(MARC, MARC_IPHONE);
    const received = sut.givenNotification({
      recipientId: MARC,
      kind: 'RENTAL_REQUEST_RECEIVED',
      audience: 'OWNER',
      createdAt: '2026-10-01T07:05:00.000Z',
    });
    sut.givenExpoDoesNotAnswer();
    await sut.whenSweepingAt('2026-10-01T07:05:10.000Z');
    sut.thenPushedAtAre({ [received]: null });
    sut.givenExpoAnswersAgain();

    await sut.whenSweepingAt('2026-10-01T07:05:20.000Z');

    sut.thenPushedAtAre({ [received]: '2026-10-01T07:05:20.000Z' });
  });

  it('forgets a phone the app was uninstalled from', async () => {
    const sut = createSendPendingPushesSUT();
    sut.givenPhone(MARC, MARC_IPHONE);
    sut.givenPhone(MARC, MARC_IPAD);
    sut.givenTheAppWasUninstalledFrom(MARC_IPAD);
    sut.givenNotification({
      recipientId: MARC,
      kind: 'RENTAL_REQUEST_RECEIVED',
      audience: 'OWNER',
      createdAt: '2026-10-01T07:05:00.000Z',
    });

    const report = await sut.whenSweepingAt('2026-10-01T07:05:10.000Z');

    sut.thenPhonesAre({ [MARC_IPHONE]: MARC });
    expect(report).toEqual({ pushed: 1, skipped: 0, forgotten: 1 });
  });
});
