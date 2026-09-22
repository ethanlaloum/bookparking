import {
  createListActiveListingsSUT,
  numberedAddresses,
} from './ListActiveListings.sut';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };
const BARLA_IN_CAPITALS = { address: '12 rue Barla, 06300 NICE', box: '12' };
const MALAUSSENA = { address: '3 avenue Malausséna, 06000 Nice', box: '4' };

const REQUESTED_PERIOD = { from: '2026-10-05', to: '2026-10-07' };

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

describe('ListActiveListings @SPEC-003', () => {
  it('matches an address in capitals from a lowercase place @EX-003-01', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(BARLA_IN_CAPITALS);
    sut.givenActiveListing(MALAUSSENA);

    const result = await sut.whenListing({ place: 'nice' });

    sut.thenListingsAre(result, [BARLA_IN_CAPITALS, MALAUSSENA]);
    sut.thenTotalIs(result, 2);
  });

  it('matches an accented address from an unaccented place @EX-003-02', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(MALAUSSENA);

    const result = await sut.whenListing({ place: 'malaussena' });

    sut.thenListingsAre(result, [MALAUSSENA]);
    sut.thenTotalIs(result, 1);
  });

  it('leaves out every listing when no address carries the place @EX-003-03', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(BARLA);

    const result = await sut.whenListing({ place: 'marseille' });

    sut.thenListingsAre(result, []);
    sut.thenTotalIs(result, 0);
  });

  it('keeps a listing whose availability covers the requested period @EX-003-04', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(BARLA, { from: '2026-10-01', to: '2026-10-31' });

    const result = await sut.whenListing(REQUESTED_PERIOD);

    sut.thenListingsAre(result, [BARLA]);
    sut.thenTotalIs(result, 1);
  });

  it('leaves out a listing whose availability starts after the requested period @EX-003-05', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(BARLA, { from: '2026-10-10', to: '2026-10-31' });

    const result = await sut.whenListing(REQUESTED_PERIOD);

    sut.thenListingsAre(result, []);
    sut.thenTotalIs(result, 0);
  });

  it('leaves out a listing whose availability ends before the requested period @EX-003-06', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(BARLA, { from: '2026-10-01', to: '2026-10-06' });

    const result = await sut.whenListing(REQUESTED_PERIOD);

    sut.thenListingsAre(result, []);
    sut.thenTotalIs(result, 0);
  });

  it('keeps a listing whose availability matches the requested period exactly @EX-003-07', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListing(BARLA, { from: '2026-10-05', to: '2026-10-07' });

    const result = await sut.whenListing(REQUESTED_PERIOD);

    sut.thenListingsAre(result, [BARLA]);
    sut.thenTotalIs(result, 1);
  });

  it('rends twenty listings out of twenty-five on the first page @EX-003-08', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListingsNumbered(25);

    const result = await sut.whenListing({ page: 1 });

    sut.thenListedAddressesAre(result, numberedAddresses(1, 20));
    sut.thenTotalIs(result, 25);
  });

  it('rends the five remaining listings on the second page @EX-003-09', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListingsNumbered(25);

    const result = await sut.whenListing({ page: 2 });

    sut.thenListedAddressesAre(result, numberedAddresses(21, 25));
    sut.thenTotalIs(result, 25);
  });

  it('caps an oversized page size at one hundred @EX-003-10', async () => {
    const sut = createListActiveListingsSUT();
    sut.givenActiveListingsNumbered(25);

    const result = await sut.whenListing({ size: 5000 });

    sut.thenPageSizeIs(result, 100);
    sut.thenListedAddressesAre(result, numberedAddresses(1, 25));
  });
});
