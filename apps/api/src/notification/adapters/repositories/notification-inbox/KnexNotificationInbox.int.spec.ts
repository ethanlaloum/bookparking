import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexNotificationInboxSUT } from './KnexNotificationInbox.sut';

const MARC = 'account-marc';
const LEA = 'account-lea';

describe('KnexNotificationInbox', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('reads the notifications of one account, newest first, with the place and the days of their request', async () => {
    const sut = createKnexNotificationInboxSUT();
    const requestId = await sut.givenLeaRequestOnMarcPlace();
    const received = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_RECEIVED',
      '2026-10-01T07:05:00.000Z',
    );
    const cancelled = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_CANCELLED_BY_OPERATOR',
      '2026-10-02T10:00:00.000Z',
    );
    await sut.givenNotified(
      requestId,
      LEA,
      'RENTAL_CANCELLED_BY_OPERATOR',
      '2026-10-02T10:00:00.000Z',
    );

    const latest = await sut.whenReadingTheLatestFor(MARC);

    const onBarla = {
      readAt: null,
      requestId,
      address: '12 rue Barla, 06300 Nice',
      box: 'B12',
      fromDay: '2026-10-10',
      toDay: '2026-10-12',
    };
    expect(latest).toEqual([
      {
        ...onBarla,
        id: cancelled,
        kind: 'RENTAL_CANCELLED_BY_OPERATOR',
        audience: 'OWNER',
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
      },
      {
        ...onBarla,
        id: received,
        kind: 'RENTAL_REQUEST_RECEIVED',
        audience: 'OWNER',
        createdAt: new Date('2026-10-01T07:05:00.000Z'),
      },
    ]);
  });

  it('tells a cancellation by Bookparking to the renter as the renter', async () => {
    const sut = createKnexNotificationInboxSUT();
    const requestId = await sut.givenLeaRequestOnMarcPlace();
    await sut.givenNotified(
      requestId,
      LEA,
      'RENTAL_CANCELLED_BY_OPERATOR',
      '2026-10-02T10:00:00.000Z',
    );

    const [notification] = await sut.whenReadingTheLatestFor(LEA);

    expect(notification?.audience).toEqual('RENTER');
  });

  it('reads no more than asked', async () => {
    const sut = createKnexNotificationInboxSUT();
    const requestId = await sut.givenLeaRequestOnMarcPlace();
    await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_RECEIVED',
      '2026-10-01T07:05:00.000Z',
    );
    const newest = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_UNANSWERED',
      '2026-10-03T07:05:00.000Z',
    );

    const latest = await sut.whenReadingTheLatestFor(MARC, 1);

    expect(latest.map((notification) => notification.id)).toEqual([newest]);
  });

  it('counts and marks read only the unread notifications of the account', async () => {
    const sut = createKnexNotificationInboxSUT();
    const requestId = await sut.givenLeaRequestOnMarcPlace();
    const alreadyRead = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_RECEIVED',
      '2026-10-01T07:05:00.000Z',
    );
    await sut.givenReadAt(alreadyRead, '2026-10-01T08:00:00.000Z');
    const unread = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_CANCELLED_BY_RENTER',
      '2026-10-02T10:00:00.000Z',
    );
    const lea = await sut.givenNotified(
      requestId,
      LEA,
      'RENTAL_REQUEST_ACCEPTED',
      '2026-10-01T09:00:00.000Z',
    );

    expect(await sut.whenCountingUnreadFor(MARC)).toEqual(1);
    await sut.whenMarkingAllReadFor(MARC, '2026-10-02T11:00:00.000Z');

    expect(await sut.whenCountingUnreadFor(MARC)).toEqual(0);
    await sut.thenReadAtAre({
      [alreadyRead]: '2026-10-01T08:00:00.000Z',
      [unread]: '2026-10-02T11:00:00.000Z',
      [lea]: null,
    });
  });

  it('marks one notification read, only for its recipient, and keeps the first reading time', async () => {
    const sut = createKnexNotificationInboxSUT();
    const requestId = await sut.givenLeaRequestOnMarcPlace();
    const accepted = await sut.givenNotified(
      requestId,
      LEA,
      'RENTAL_REQUEST_ACCEPTED',
      '2026-10-01T09:00:00.000Z',
    );
    const received = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_RECEIVED',
      '2026-10-01T07:05:00.000Z',
    );

    await sut.whenMarkingOneReadFor(MARC, accepted, '2026-10-01T09:30:00.000Z');
    await sut.whenMarkingOneReadFor(LEA, accepted, '2026-10-01T10:00:00.000Z');
    await sut.whenMarkingOneReadFor(LEA, accepted, '2026-10-01T11:00:00.000Z');

    await sut.thenReadAtAre({
      [accepted]: '2026-10-01T10:00:00.000Z',
      [received]: null,
    });
  });
});
