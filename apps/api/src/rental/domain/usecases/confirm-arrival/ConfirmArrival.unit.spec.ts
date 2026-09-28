import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { createConfirmArrivalSUT } from './ConfirmArrival.sut';
import { ArrivalNotYetPossibleError } from './errors/ArrivalNotYetPossibleError';

const FIRST_INSTANT = '2026-10-09T22:00:00.000Z';
const ONE_SECOND_BEFORE = '2026-10-09T21:59:59.000Z';

describe('ConfirmArrival', () => {
  it('records the arrival of the renter from the first instant of the rental', async () => {
    const sut = createConfirmArrivalSUT();
    const id = await sut.givenConfirmedRental();

    const result = await sut.whenArrivingAs(sut.lea, id, FIRST_INSTANT);

    sut.thenResultIsRight(result);
    sut.thenArrivedAtIs(id, FIRST_INSTANT);
  });

  it('refuses an arrival one second before the rental starts', async () => {
    const sut = createConfirmArrivalSUT();
    const id = await sut.givenConfirmedRental();

    const result = await sut.whenArrivingAs(sut.lea, id, ONE_SECOND_BEFORE);

    sut.thenRefusedWith(result, ArrivalNotYetPossibleError);
    sut.thenArrivedAtIs(id, null);
  });

  it('refuses an arrival on a request the owner has not confirmed', async () => {
    const sut = createConfirmArrivalSUT();
    const id = await sut.givenPendingRequest();

    const result = await sut.whenArrivingAs(sut.lea, id, FIRST_INSTANT);

    sut.thenRefusedWith(result, ArrivalNotYetPossibleError);
  });

  it('answers another account as it answers an unknown request', async () => {
    const sut = createConfirmArrivalSUT();
    const id = await sut.givenConfirmedRental();

    const result = await sut.whenArrivingAs('account-marc', id, FIRST_INSTANT);

    sut.thenRefusedWith(result, RentalRequestNotFoundError);
    sut.thenArrivedAtIs(id, null);
  });

  it('keeps the first arrival time when the renter confirms twice', async () => {
    const sut = createConfirmArrivalSUT();
    const id = await sut.givenConfirmedRental();
    await sut.whenArrivingAs(sut.lea, id, FIRST_INSTANT);

    const again = await sut.whenArrivingAs(
      sut.lea,
      id,
      '2026-10-10T08:00:00.000Z',
    );

    sut.thenResultIsRight(again);
    sut.thenArrivedAtIs(id, FIRST_INSTANT);
  });
});
