import { ListingStatus } from '../../entities/Listing';
import { InvalidStayError } from './errors/InvalidStayError';
import { createListFreeListingsSUT } from './ListFreeListings.sut';

const OCTOBER = { from: '2026-10-01', to: '2026-10-31' };
const INVALID_STAY = 'Les dates recherchées sont invalides';

describe('ListFreeListings', () => {
  it('keeps every published place open on the whole stay and taken by nobody', async () => {
    const sut = createListFreeListingsSUT();
    const b12 = sut.givenPlace({ box: 'B12', open: OCTOBER });
    const b14 = sut.givenPlace({ box: 'B14', open: OCTOBER });

    const result = await sut.whenSearching({
      from: '2026-10-10',
      to: '2026-10-12',
    });

    sut.thenFreeListingsAre(result, [b12, b14]);
  });

  it('drops a place taken during the stay and keeps its neighbour', async () => {
    const sut = createListFreeListingsSUT();
    const b12 = sut.givenPlace({ box: 'B12', open: OCTOBER });
    const b14 = sut.givenPlace({ box: 'B14', open: OCTOBER });
    sut.givenPlaceTaken(b12);

    const result = await sut.whenSearching({
      from: '2026-10-10',
      to: '2026-10-12',
    });

    sut.thenFreeListingsAre(result, [b14]);
  });

  it('keeps a stay that begins on the first open day and ends on the last one', async () => {
    const sut = createListFreeListingsSUT();
    const b12 = sut.givenPlace({ box: 'B12', open: OCTOBER });

    const result = await sut.whenSearching({
      from: '2026-10-01',
      to: '2026-10-31',
    });

    sut.thenFreeListingsAre(result, [b12]);
  });

  it('drops a place that opens the day after the arrival', async () => {
    const sut = createListFreeListingsSUT();
    sut.givenPlace({ box: 'B12', open: OCTOBER });

    const result = await sut.whenSearching({
      from: '2026-09-30',
      to: '2026-10-02',
    });

    sut.thenFreeListingsAre(result, []);
  });

  it('drops a place that closes the day before the departure', async () => {
    const sut = createListFreeListingsSUT();
    sut.givenPlace({ box: 'B12', open: OCTOBER });

    const result = await sut.whenSearching({
      from: '2026-10-30',
      to: '2026-11-01',
    });

    sut.thenFreeListingsAre(result, []);
  });

  it('never offers an unpublished place', async () => {
    const sut = createListFreeListingsSUT();
    sut.givenPlace({
      box: 'B12',
      open: OCTOBER,
      status: ListingStatus.UNPUBLISHED,
    });

    const result = await sut.whenSearching({
      from: '2026-10-10',
      to: '2026-10-12',
    });

    sut.thenFreeListingsAre(result, []);
  });

  it('asks who holds the places for the searched days and for the account searching', async () => {
    const sut = createListFreeListingsSUT();
    sut.givenPlace({ box: 'B12', open: OCTOBER });

    await sut.whenSearching(
      { from: '2026-10-10', to: '2026-10-10' },
      'account-lea',
    );

    sut.thenOccupancyWasAskedFor([
      {
        stay: { from: '2026-10-10', to: '2026-10-10' },
        viewerId: 'account-lea',
      },
    ]);
  });

  it('refuses a departure before the arrival, without asking anything', async () => {
    const sut = createListFreeListingsSUT();
    sut.givenPlace({ box: 'B12', open: OCTOBER });

    const result = await sut.whenSearching({
      from: '2026-10-12',
      to: '2026-10-10',
    });

    sut.thenSearchIsRefusedWith(result, InvalidStayError, INVALID_STAY);
    sut.thenOccupancyWasAskedFor([]);
  });

  it('refuses a day that does not exist', async () => {
    const sut = createListFreeListingsSUT();

    const result = await sut.whenSearching({
      from: '2026-02-28',
      to: '2026-02-30',
    });

    sut.thenSearchIsRefusedWith(result, InvalidStayError, INVALID_STAY);
  });

  it('refuses a day that is not written year-month-day', async () => {
    const sut = createListFreeListingsSUT();

    const result = await sut.whenSearching({
      from: '10/10/2026',
      to: '2026-10-12',
    });

    sut.thenSearchIsRefusedWith(result, InvalidStayError, INVALID_STAY);
  });
});
