import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexPushQueueSUT } from './KnexPushQueue.sut';

const MARC = 'account-marc';
const LEA = 'account-lea';
const MARC_IPHONE = 'ExponentPushToken[marc-iphone]';
const MARC_IPAD = 'ExponentPushToken[marc-ipad]';
const LEA_IPHONE = 'ExponentPushToken[lea-iphone]';

describe('KnexPushQueue and KnexPushDeviceRepository', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('reads each unpushed notification, oldest first, with the phones of its recipient', async () => {
    const sut = createKnexPushQueueSUT();
    const requestId = await sut.givenLeaRequestOnMarcPlace();
    await sut.givenPhone(MARC, MARC_IPHONE, '2026-09-01T09:00:00.000Z');
    await sut.givenPhone(MARC, MARC_IPAD, '2026-09-02T09:00:00.000Z');
    await sut.givenPhone(LEA, LEA_IPHONE, '2026-09-03T09:00:00.000Z');
    const cancelled = await sut.givenNotified(
      requestId,
      LEA,
      'RENTAL_CANCELLED_BY_OPERATOR',
      '2026-10-02T10:00:00.000Z',
    );
    const received = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_RECEIVED',
      '2026-10-01T07:05:00.000Z',
    );

    const queue = await sut.whenReadingTheQueue();

    expect(queue).toEqual([
      {
        notificationId: received,
        kind: 'RENTAL_REQUEST_RECEIVED',
        audience: 'OWNER',
        createdAt: new Date('2026-10-01T07:05:00.000Z'),
        tokens: [MARC_IPHONE, MARC_IPAD],
      },
      {
        notificationId: cancelled,
        kind: 'RENTAL_CANCELLED_BY_OPERATOR',
        audience: 'RENTER',
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
        tokens: [LEA_IPHONE],
      },
    ]);
  });

  it('no longer reads a notification once pushed, and keeps the first pushing time', async () => {
    const sut = createKnexPushQueueSUT();
    const requestId = await sut.givenLeaRequestOnMarcPlace();
    const received = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_RECEIVED',
      '2026-10-01T07:05:00.000Z',
    );
    await sut.whenMarkingPushed([received], '2026-10-01T07:05:10.000Z');

    await sut.whenMarkingPushed([received], '2026-10-01T07:05:20.000Z');

    expect(await sut.whenReadingTheQueue()).toEqual([]);
    await sut.thenPushedAtAre({ [received]: '2026-10-01T07:05:10.000Z' });
  });

  it('reads no more than asked', async () => {
    const sut = createKnexPushQueueSUT();
    const requestId = await sut.givenLeaRequestOnMarcPlace();
    const oldest = await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_RECEIVED',
      '2026-10-01T07:05:00.000Z',
    );
    await sut.givenNotified(
      requestId,
      MARC,
      'RENTAL_REQUEST_UNANSWERED',
      '2026-10-03T07:05:00.000Z',
    );

    const queue = await sut.whenReadingTheQueue(1);

    expect(queue.map((push) => push.notificationId)).toEqual([oldest]);
  });

  it('gives a phone to the last account signed in on it, and forgets it on demand', async () => {
    const sut = createKnexPushQueueSUT();
    await sut.givenPhone(MARC, MARC_IPHONE, '2026-09-01T09:00:00.000Z');
    await sut.givenPhone(LEA, MARC_IPHONE, '2026-09-02T09:00:00.000Z');
    await sut.givenPhone(MARC, MARC_IPAD, '2026-09-02T09:00:00.000Z');
    await sut.thenPhonesAre({ [MARC_IPHONE]: LEA, [MARC_IPAD]: MARC });

    await sut.whenForgetting([MARC_IPHONE, 'ExponentPushToken[unknown]']);

    await sut.thenPhonesAre({ [MARC_IPAD]: MARC });
  });
});
