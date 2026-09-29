import { createListRentalRequestsSUT } from './ListRentalRequests.sut';

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
