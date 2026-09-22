import { createConfirmRentalRequestSUT } from './ConfirmRentalRequest.sut';
import { RentalRequestExpiredError } from './errors/RentalRequestExpiredError';
import { RentalRequestNotFoundError } from './errors/RentalRequestNotFoundError';

const MARC_OWNER_ID = 'marc-owner-id';
const LEA_RENTER_ID = 'lea-renter-id';
const OTHER_OWNER_ID = 'other-owner-id';
const UNKNOWN_REQUEST_ID = 'a6c1d2e3-0000-4000-8000-000000000000';

describe('ConfirmRentalRequest', () => {
  it('confirms a pending request for the owner of the listing', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });

    const result = await sut.whenConfirming({
      requestId,
      ownerId: MARC_OWNER_ID,
    });

    sut.thenResultIsRight(result);
    sut.thenRequestIsConfirmed(requestId);
    sut.thenConfirmationWasWrittenOnce(requestId);
  });

  it('refuses a request owned by someone else exactly as an unknown one', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });

    const notOwned = await sut.whenConfirming({
      requestId,
      ownerId: OTHER_OWNER_ID,
    });
    const unknown = await sut.whenConfirming({
      requestId: UNKNOWN_REQUEST_ID,
      ownerId: OTHER_OWNER_ID,
    });

    sut.thenResultIsLeftWithError(notOwned, RentalRequestNotFoundError);
    sut.thenRefusalsAreIndistinguishable(notOwned, unknown);
    sut.thenNothingWasConfirmed();
  });

  it('confirms twice without a second write', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });

    const first = await sut.whenConfirming({
      requestId,
      ownerId: MARC_OWNER_ID,
    });
    const second = await sut.whenConfirming({
      requestId,
      ownerId: MARC_OWNER_ID,
    });

    sut.thenResultIsRight(first);
    sut.thenResultIsRight(second);
    sut.thenConfirmationWasWrittenOnce(requestId);
  });

  it('refuses a request the renter tries to confirm for themselves', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });

    const result = await sut.whenConfirming({
      requestId,
      ownerId: LEA_RENTER_ID,
    });

    sut.thenResultIsLeftWithError(result, RentalRequestNotFoundError);
    sut.thenNothingWasConfirmed();
  });
  it('refuses to confirm a request that has expired, and says so', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });
    sut.givenRequestHasExpired(requestId);

    const result = await sut.whenConfirming({
      requestId,
      ownerId: MARC_OWNER_ID,
    });

    sut.thenResultIsLeftWithError(result, RentalRequestExpiredError);
    sut.thenNothingWasConfirmed();
  });
});
