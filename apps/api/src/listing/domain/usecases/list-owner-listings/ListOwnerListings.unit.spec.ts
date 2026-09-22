import { createListOwnerListingsSUT } from './ListOwnerListings.sut';

const MARC = 'account-marc';
const LOUISE = 'account-louise';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };
const MALAUSSENA = { address: '3 avenue Malausséna, 06000 Nice', box: '4' };
const GAMBETTA = { address: '8 boulevard Gambetta, 06000 Nice', box: 'A1' };

describe('ListOwnerListings', () => {
  it('lists the listings of the asking owner', async () => {
    const sut = createListOwnerListingsSUT();
    sut.givenActiveListingOwnedBy(MARC, BARLA);
    sut.givenActiveListingOwnedBy(MARC, MALAUSSENA);

    const result = await sut.whenListingFor(MARC);

    sut.thenListingsAre(result, [BARLA, MALAUSSENA]);
  });

  it('leaves out the listings of another owner', async () => {
    const sut = createListOwnerListingsSUT();
    sut.givenActiveListingOwnedBy(MARC, BARLA);
    sut.givenActiveListingOwnedBy(LOUISE, MALAUSSENA);

    const result = await sut.whenListingFor(MARC);

    sut.thenListingsAre(result, [BARLA]);
  });

  it('keeps an unpublished listing in the list', async () => {
    const sut = createListOwnerListingsSUT();
    sut.givenActiveListingOwnedBy(MARC, BARLA);
    sut.givenUnpublishedListingOwnedBy(MARC, GAMBETTA);

    const result = await sut.whenListingFor(MARC);

    sut.thenListingsAre(result, [BARLA, GAMBETTA]);
  });

  it('lists nothing for an owner who published nothing', async () => {
    const sut = createListOwnerListingsSUT();
    sut.givenActiveListingOwnedBy(LOUISE, BARLA);

    const result = await sut.whenListingFor(MARC);

    sut.thenListingsAre(result, []);
  });

  it('fails with an unknown error when the repository cannot be read', async () => {
    const sut = createListOwnerListingsSUT();
    sut.givenListingRepositoryFailsToRead();

    const result = await sut.whenListingFor(MARC);

    sut.thenResultIsAnUnknownError(result);
  });
});
