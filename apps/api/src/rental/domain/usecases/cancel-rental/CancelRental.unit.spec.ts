import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { createCancelRentalSUT } from './CancelRental.sut';
import { RentalAlreadyStartedError } from './errors/RentalAlreadyStartedError';
import { RentalNotCancellableError } from './errors/RentalNotCancellableError';

// La location commence le 10/10/2026 à 00:00, heure de Paris (09/10 22:00 UTC) ;
// l'échéance d'annulation gratuite tombe 24 heures plus tôt (08/10 22:00 UTC).
const FIVE_DAYS_BEFORE = '2026-10-05T08:00:00.000Z';
const AT_THE_DEADLINE = '2026-10-08T22:00:00.000Z';
const ONE_MINUTE_AFTER_THE_DEADLINE = '2026-10-08T22:01:00.000Z';
const HALF_A_DAY_AFTER_THE_DEADLINE = '2026-10-09T10:00:00.000Z';
const THIRTY_HOURS_BEFORE_THE_START = '2026-10-08T16:00:00.000Z';
const ONCE_STARTED = '2026-10-10T06:00:00.000Z';

describe('CancelRental @SPEC-005', () => {
  it('releases the hold of a request still awaiting the owner @EX-005-01', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaHoldPlaced();

    const result = await sut.whenCancelledBy(
      sut.lea,
      id,
      HALF_A_DAY_AFTER_THE_DEADLINE,
    );

    sut.thenOutcomeIs(result, 'RELEASED');
    sut.thenRequestStateIs(id, { status: 'CANCELLED', money: 'RELEASED' });
    sut.thenReleasesAre([id]);
  });

  it('refuses to cancel a rental that has started @EX-005-02', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRentalConfirmed();

    const result = await sut.whenCancelledBy(sut.lea, id, ONCE_STARTED);

    sut.thenRefusedWith(result, RentalAlreadyStartedError);
    sut.thenRequestStateIs(id, { status: 'CONFIRMED', money: 'CAPTURED' });
  });

  it('refunds once when cancelled twice @EX-005-03', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRentalConfirmed();
    await sut.whenCancelledBy(sut.lea, id, FIVE_DAYS_BEFORE);

    const again = await sut.whenCancelledBy(sut.lea, id, FIVE_DAYS_BEFORE);

    sut.thenOutcomeIs(again, 'REFUNDED');
    sut.thenRefundsAre([id]);
  });

  it('lets no other account cancel @EX-005-04', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRentalConfirmed();

    const result = await sut.whenCancelledBy(sut.paul, id, FIVE_DAYS_BEFORE);

    sut.thenRefusedWith(result, RentalRequestNotFoundError);
    sut.thenRequestStateIs(id, { status: 'CONFIRMED', money: 'CAPTURED' });
  });

  it('does not cancel a request awaiting payment, which is abandoned instead @EX-005-05', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRequestAwaitingPayment();

    const result = await sut.whenCancelledBy(sut.lea, id, FIVE_DAYS_BEFORE);

    sut.thenRefusedWith(result, RentalNotCancellableError);
    sut.thenRequestStateIs(id, { status: 'AWAITING_PAYMENT', money: 'NONE' });
  });

  it('refunds in full a rental cancelled five days before @EX-005-06', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRentalConfirmed();

    const result = await sut.whenCancelledBy(sut.lea, id, FIVE_DAYS_BEFORE);

    sut.thenOutcomeIs(result, 'REFUNDED');
    sut.thenRequestStateIs(id, { status: 'CANCELLED', money: 'REFUNDED' });
    sut.thenRefundsAre([id]);
  });

  it('refunds a rental cancelled at the deadline itself @EX-005-07', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRentalConfirmed();

    const result = await sut.whenCancelledBy(sut.lea, id, AT_THE_DEADLINE);

    sut.thenOutcomeIs(result, 'REFUNDED');
    sut.thenRefundsAre([id]);
  });

  it('keeps the money of a rental cancelled one minute after the deadline @EX-005-08', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRentalConfirmed();

    const result = await sut.whenCancelledBy(
      sut.lea,
      id,
      ONE_MINUTE_AFTER_THE_DEADLINE,
    );

    sut.thenOutcomeIs(result, 'KEPT');
    sut.thenRequestStateIs(id, { status: 'CANCELLED', money: 'CAPTURED' });
    sut.thenRefundsAre([]);
  });

  it('keeps the deadline frozen at request time when the delay grows later @EX-005-10', async () => {
    const sut = createCancelRentalSUT({ freeCancellationHoursNow: 48 });
    const id = await sut.givenLeaRentalConfirmed(24);

    const result = await sut.whenCancelledBy(
      sut.lea,
      id,
      THIRTY_HOURS_BEFORE_THE_START,
    );

    sut.thenOutcomeIs(result, 'REFUNDED');
    sut.thenRefundsAre([id]);
  });

  it('refunds in full a rental the owner cancels after the renter deadline @EX-005-12', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRentalConfirmed();

    const result = await sut.whenCancelledBy(
      sut.marc,
      id,
      HALF_A_DAY_AFTER_THE_DEADLINE,
    );

    sut.thenOutcomeIs(result, 'REFUNDED');
    sut.thenRequestStateIs(id, { status: 'CANCELLED', money: 'REFUNDED' });
    sut.thenRefundsAre([id]);
  });

  it('releases the hold of a request the owner cancels @EX-005-13', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaHoldPlaced();

    const result = await sut.whenCancelledBy(sut.marc, id, FIVE_DAYS_BEFORE);

    sut.thenOutcomeIs(result, 'RELEASED');
    sut.thenReleasesAre([id]);
  });

  it('lets the owner cancel no request he cannot see @EX-005-14', async () => {
    const sut = createCancelRentalSUT();
    const id = await sut.givenLeaRequestAwaitingPayment();

    const result = await sut.whenCancelledBy(sut.marc, id, FIVE_DAYS_BEFORE);

    sut.thenRefusedWith(result, RentalRequestNotFoundError);
  });
});
