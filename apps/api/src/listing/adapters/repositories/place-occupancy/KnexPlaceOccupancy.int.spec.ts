import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexPlaceOccupancySUT } from './KnexPlaceOccupancy.sut';

const LEA = 'account-lea';
const PAUL = 'account-paul';
const OCTOBER_10_TO_12 = { from: '2026-10-10', to: '2026-10-12' };

describe('KnexPlaceOccupancy', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('takes a place held by a request waiting for payment, pending or confirmed', async () => {
    const sut = createKnexPlaceOccupancySUT();
    const b1 = await sut.givenPlace('B1');
    const b2 = await sut.givenPlace('B2');
    const b3 = await sut.givenPlace('B3');
    await sut.givenPlace('B4');
    await sut.givenRequest({
      place: b1,
      renterId: LEA,
      days: OCTOBER_10_TO_12,
      status: 'AWAITING_PAYMENT',
    });
    await sut.givenRequest({
      place: b2,
      renterId: LEA,
      days: OCTOBER_10_TO_12,
      status: 'PENDING',
    });
    await sut.givenRequest({
      place: b3,
      renterId: LEA,
      days: OCTOBER_10_TO_12,
      status: 'CONFIRMED',
    });

    const taken = await sut.whenAskingWhichPlacesAreTaken(OCTOBER_10_TO_12);

    expect(taken).toEqual([b1.placeKey(), b2.placeKey(), b3.placeKey()]);
  });

  it('frees a place whose request expired, was cancelled, abandoned or refused by the bank', async () => {
    const sut = createKnexPlaceOccupancySUT();
    for (const [box, status] of [
      ['B1', 'EXPIRED'],
      ['B2', 'CANCELLED'],
      ['B3', 'ABANDONED'],
      ['B4', 'PAYMENT_FAILED'],
    ] as const) {
      const place = await sut.givenPlace(box);
      await sut.givenRequest({
        place,
        renterId: LEA,
        days: OCTOBER_10_TO_12,
        status,
      });
    }

    const taken = await sut.whenAskingWhichPlacesAreTaken(OCTOBER_10_TO_12);

    expect(taken).toEqual([]);
  });

  it('takes the place when the stay shares a single day with the request, and only then', async () => {
    const sut = createKnexPlaceOccupancySUT();
    const b1 = await sut.givenPlace('B1');
    await sut.givenRequest({
      place: b1,
      renterId: LEA,
      days: OCTOBER_10_TO_12,
      status: 'CONFIRMED',
    });

    const answers = {
      endingOnArrival: await sut.whenAskingWhichPlacesAreTaken({
        from: '2026-10-08',
        to: '2026-10-10',
      }),
      beginningOnDeparture: await sut.whenAskingWhichPlacesAreTaken({
        from: '2026-10-12',
        to: '2026-10-14',
      }),
      dayBefore: await sut.whenAskingWhichPlacesAreTaken({
        from: '2026-10-08',
        to: '2026-10-09',
      }),
      dayAfter: await sut.whenAskingWhichPlacesAreTaken({
        from: '2026-10-13',
        to: '2026-10-15',
      }),
    };

    expect(answers).toEqual({
      endingOnArrival: [b1.placeKey()],
      beginningOnDeparture: [b1.placeKey()],
      dayBefore: [],
      dayAfter: [],
    });
  });

  it('counts days in Paris time, across the switch to winter time', async () => {
    const sut = createKnexPlaceOccupancySUT();
    const b1 = await sut.givenPlace('B1');
    await sut.givenRequest({
      place: b1,
      renterId: LEA,
      days: { from: '2026-10-25', to: '2026-10-25' },
      status: 'CONFIRMED',
    });

    const answers = {
      sameDay: await sut.whenAskingWhichPlacesAreTaken({
        from: '2026-10-25',
        to: '2026-10-25',
      }),
      dayBefore: await sut.whenAskingWhichPlacesAreTaken({
        from: '2026-10-24',
        to: '2026-10-24',
      }),
      dayAfter: await sut.whenAskingWhichPlacesAreTaken({
        from: '2026-10-26',
        to: '2026-10-26',
      }),
    };

    expect(answers).toEqual({
      sameDay: [b1.placeKey()],
      dayBefore: [],
      dayAfter: [],
    });
  });

  it('does not hold the searching account back with its own unpaid request, only with the others', async () => {
    const sut = createKnexPlaceOccupancySUT();
    const leaUnpaid = await sut.givenPlace('B1');
    const paulUnpaid = await sut.givenPlace('B2');
    const leaPending = await sut.givenPlace('B3');
    await sut.givenRequest({
      place: leaUnpaid,
      renterId: LEA,
      days: OCTOBER_10_TO_12,
      status: 'AWAITING_PAYMENT',
    });
    await sut.givenRequest({
      place: paulUnpaid,
      renterId: PAUL,
      days: OCTOBER_10_TO_12,
      status: 'AWAITING_PAYMENT',
    });
    await sut.givenRequest({
      place: leaPending,
      renterId: LEA,
      days: OCTOBER_10_TO_12,
      status: 'PENDING',
    });

    const answers = {
      lea: await sut.whenAskingWhichPlacesAreTaken(OCTOBER_10_TO_12, LEA),
      anonymous: await sut.whenAskingWhichPlacesAreTaken(OCTOBER_10_TO_12),
    };

    expect(answers).toEqual({
      lea: [paulUnpaid.placeKey(), leaPending.placeKey()],
      anonymous: [
        leaUnpaid.placeKey(),
        paulUnpaid.placeKey(),
        leaPending.placeKey(),
      ],
    });
  });
});
