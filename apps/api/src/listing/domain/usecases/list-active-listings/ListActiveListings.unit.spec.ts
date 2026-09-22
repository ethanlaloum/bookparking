import { createListActiveListingsSUT } from './ListActiveListings.sut';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };
const MALAUSSENA = { address: '3 avenue Malausséna, 06000 Nice', box: '4' };

describe('ListActiveListings @SPEC-001', () => {
  it('lists every active listing', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(BARLA);
    sut.givenActiveListing(MALAUSSENA);

    const result = await sut.whenListing();

    sut.thenListingsAre(result, [BARLA, MALAUSSENA]);
  });

  it('leaves an unpublished listing out of the list', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(BARLA);
    sut.givenUnpublishedListing(MALAUSSENA);

    const result = await sut.whenListing();

    sut.thenListingsAre(result, [BARLA]);
  });

  it('rends an empty list when nothing is published', async () => {
    const sut = createListActiveListingsSUT();

    const result = await sut.whenListing();

    sut.thenListingsAre(result, []);
  });

  it('converts a repository failure into an unknown error', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenListingRepositoryFailsToRead();

    const result = await sut.whenListing();

    sut.thenResultIsAnUnknownError(result);
  });
});
