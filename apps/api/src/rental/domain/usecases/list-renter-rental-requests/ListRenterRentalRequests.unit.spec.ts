import {
  ACCESS_INSTRUCTIONS,
  createListRentalRequestsSUT,
} from './ListRentalRequests.sut';

const MARC = 'account-marc';
const LOUISE = 'account-louise';
const CHLOE = 'account-chloe';

const MALAUSSENA = {
  address: '3 avenue Malausséna, 06000 Nice',
  box: 'box 4',
};
const BARLA = { address: '12 rue Barla, 06300 Nice', box: 'box 12' };

describe('ListRenterRentalRequests', () => {
  it('lists the requests the asking renter made', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      from: '2026-10-10',
      to: '2026-10-12',
    });

    const result = await sut.whenListingAsRenter(LOUISE);

    sut.thenRequestedPlacesAre(result, [MALAUSSENA]);
  });

  it('leaves out a request another renter made', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      from: '2026-10-10',
      to: '2026-10-12',
    });
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: CHLOE,
      ...BARLA,
      from: '2026-11-10',
      to: '2026-11-12',
    });

    const result = await sut.whenListingAsRenter(LOUISE);

    sut.thenRequestedPlacesAre(result, [MALAUSSENA]);
  });

  it('carries the price the request was agreed at', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      from: '2026-10-10',
      to: '2026-10-12',
    });

    const result = await sut.whenListingAsRenter(LOUISE);

    sut.thenPricesInCentsAre(result, [4500]);
  });

  it('fails with an unknown error when the repository cannot be read', async () => {
    const sut = createListRentalRequestsSUT();
    sut.givenRentalRepositoryFailsToRead();

    const result = await sut.whenListingAsRenter(LOUISE);

    sut.thenResultIsAnUnknownError(result);
  });
});

describe('ListRenterRentalRequests — access instructions and answer deadline', () => {
  const TEN_TO_TWELVE = { from: '2026-10-10', to: '2026-10-12' };

  it('hands the access instructions to the renter once the owner has confirmed', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenConfirmedRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      ...TEN_TO_TWELVE,
    });

    const result = await sut.whenListingAsRenter(LOUISE);

    sut.thenAccessInstructionsAre(result, [ACCESS_INSTRUCTIONS]);
  });

  it('keeps them from a request the owner has not confirmed, or that was cancelled', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      ...TEN_TO_TWELVE,
    });
    const cancelled = await sut.givenConfirmedRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...BARLA,
      ...TEN_TO_TWELVE,
    });
    await sut.givenCancelledByTheRenter(cancelled);

    const result = await sut.whenListingAsRenter(LOUISE);

    sut.thenAccessInstructionsAre(result, [null, null]);
  });

  it('keeps them until the last rented day ends, Paris time, and no longer', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenConfirmedRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      ...TEN_TO_TWELVE,
    });

    sut.givenItIsNow('2026-10-12T21:59:59.000Z');
    const lastMoment = await sut.whenListingAsRenter(LOUISE);
    sut.givenItIsNow('2026-10-12T22:00:00.000Z');
    const afterwards = await sut.whenListingAsRenter(LOUISE);

    sut.thenAccessInstructionsAre(lastMoment, [ACCESS_INSTRUCTIONS]);
    sut.thenAccessInstructionsAre(afterwards, [null]);
  });

  it('never hands them to the owner, who wrote them', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenConfirmedRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      ...TEN_TO_TWELVE,
    });

    const result = await sut.whenListingAsOwner(MARC);

    sut.thenAccessInstructionsAre(result, [null]);
  });

  it('tells both sides when the owner must answer by: forty-eight hours after the hold', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenHoldPlacedAt(
      { ownerId: MARC, renterId: LOUISE, ...MALAUSSENA, ...TEN_TO_TWELVE },
      '2026-10-01T09:05:00.000Z',
    );
    await sut.givenConfirmedRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...BARLA,
      ...TEN_TO_TWELVE,
    });

    const asRenter = await sut.whenListingAsRenter(LOUISE);
    const asOwner = await sut.whenListingAsOwner(MARC);

    sut.thenAnswerDeadlinesAre(asRenter, ['2026-10-03T09:05:00.000Z', null]);
    sut.thenAnswerDeadlinesAre(asOwner, ['2026-10-03T09:05:00.000Z', null]);
  });

  it('counts the deadline from the request itself when it was made before payments', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      ...TEN_TO_TWELVE,
    });

    const result = await sut.whenListingAsRenter(LOUISE);

    sut.thenAnswerDeadlinesAre(result, ['2026-10-03T09:00:00.000Z']);
  });
});

describe('ListOwnerRentalRequests — owner share', () => {
  it('tells the owner what he will receive once the commission frozen on the request is taken', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenConfirmedRequestWithFee(
      {
        ownerId: MARC,
        renterId: LOUISE,
        ...MALAUSSENA,
        from: '2026-10-10',
        to: '2026-10-12',
      },
      15,
    );

    const asOwner = await sut.whenListingAsOwner(MARC);
    const asRenter = await sut.whenListingAsRenter(LOUISE);

    // 3 jours à 15 € = 45 € ; 15 % = 6,75 € ; reste 38,25 €.
    sut.thenOwnerSharesAre(asOwner, [3825]);
    sut.thenOwnerSharesAre(asRenter, [null]);
  });
});
