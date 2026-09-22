import { createListRentalRequestsSUT } from '../list-renter-rental-requests/ListRentalRequests.sut';

const MARC = 'account-marc';
const PAUL = 'account-paul';
const LOUISE = 'account-louise';

const MALAUSSENA = {
  address: '3 avenue Malausséna, 06000 Nice',
  box: 'box 4',
};
const BARLA = { address: '12 rue Barla, 06300 Nice', box: 'box 12' };

describe('ListOwnerRentalRequests', () => {
  it('lists the requests made on the asking owner places', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      from: '2026-10-10',
      to: '2026-10-12',
    });

    const result = await sut.whenListingAsOwner(MARC);

    sut.thenRequestedPlacesAre(result, [MALAUSSENA]);
  });

  it('leaves out a request made on another owner place', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      from: '2026-10-10',
      to: '2026-10-12',
    });
    await sut.givenPendingRequest({
      ownerId: PAUL,
      renterId: LOUISE,
      ...BARLA,
      from: '2026-11-10',
      to: '2026-11-12',
    });

    const result = await sut.whenListingAsOwner(MARC);

    sut.thenRequestedPlacesAre(result, [MALAUSSENA]);
  });

  it('tells a confirmed request apart from a pending one', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenConfirmedRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...MALAUSSENA,
      from: '2026-10-10',
      to: '2026-10-12',
    });
    await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LOUISE,
      ...BARLA,
      from: '2026-11-10',
      to: '2026-11-12',
    });

    const result = await sut.whenListingAsOwner(MARC);

    sut.thenStatusesAre(result, ['CONFIRMED', 'PENDING']);
  });

  it('lists nothing for an owner nobody asked', async () => {
    const sut = createListRentalRequestsSUT();
    await sut.givenPendingRequest({
      ownerId: PAUL,
      renterId: LOUISE,
      ...BARLA,
      from: '2026-11-10',
      to: '2026-11-12',
    });

    const result = await sut.whenListingAsOwner(MARC);

    sut.thenRequestedPlacesAre(result, []);
  });

  it('fails with an unknown error when the repository cannot be read', async () => {
    const sut = createListRentalRequestsSUT();
    sut.givenRentalRepositoryFailsToRead();

    const result = await sut.whenListingAsOwner(MARC);

    sut.thenResultIsAnUnknownError(result);
  });
});
