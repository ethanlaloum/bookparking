import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { createAbandonRentalRequestSUT } from './AbandonRentalRequest.sut';
import { RentalRequestAlreadyPaidError } from './errors/RentalRequestAlreadyPaidError';

const LEA = 'account-lea';
const PAUL = 'account-paul';

describe('AbandonRentalRequest @SPEC-004', () => {
  it('closes the payment page and abandons the request @EX-004-16', async () => {
    const sut = createAbandonRentalRequestSUT();
    const requestId = await sut.givenLeaRequestAwaitingPayment({
      renterId: LEA,
      checkoutSessionId: 'cs_test_lea',
    });

    const result = await sut.whenAbandonedBy(LEA, requestId);

    sut.thenResultIsRight(result);
    sut.thenClosedPaymentPagesAre(['cs_test_lea']);
    sut.thenStatusIs(requestId, 'ABANDONED');
  });

  it('refuses to abandon somebody else request as if it did not exist @EX-004-17', async () => {
    const sut = createAbandonRentalRequestSUT();
    const requestId = await sut.givenLeaRequestAwaitingPayment({
      renterId: LEA,
      checkoutSessionId: 'cs_test_lea',
    });

    const result = await sut.whenAbandonedBy(PAUL, requestId);

    sut.thenResultIsLeftWithError(result, RentalRequestNotFoundError);
    sut.thenClosedPaymentPagesAre([]);
    sut.thenStatusIs(requestId, 'AWAITING_PAYMENT');
  });

  it('refuses to abandon a request whose hold is already placed @EX-004-20', async () => {
    const sut = createAbandonRentalRequestSUT();
    const requestId = await sut.givenLeaRequestAwaitingPayment({
      renterId: LEA,
      checkoutSessionId: 'cs_test_lea',
    });
    await sut.givenHoldPlaced(requestId);

    const result = await sut.whenAbandonedBy(LEA, requestId);

    sut.thenResultIsLeftWithError(result, RentalRequestAlreadyPaidError);
    sut.thenClosedPaymentPagesAre([]);
    sut.thenStatusIs(requestId, 'PENDING');
  });
});
