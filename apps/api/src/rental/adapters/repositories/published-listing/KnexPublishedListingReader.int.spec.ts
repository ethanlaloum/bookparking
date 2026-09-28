import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { ListingStatus } from '../../../../listing/domain/entities/Listing';
import { createKnexPublishedListingReaderSUT } from './KnexPublishedListingReader.sut';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };

describe('KnexPublishedListingReader', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('reads the pricing and the days a published place is open', async () => {
    const sut = createKnexPublishedListingReaderSUT();
    await sut.givenListing({
      place: BARLA,
      open: { from: '2026-10-01', to: '2026-10-31' },
    });

    const published = await sut.whenReading({
      address: '12 Rue Barla, 06300 NICE',
      box: '12',
    });

    expect(published).toEqual({
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      pricing: { dayInCents: 1500, weekInCents: null, monthInCents: 25000 },
      openDays: { from: '2026-10-01', to: '2026-10-31' },
    });
  });

  it('reads nothing for a place that is no longer published', async () => {
    const sut = createKnexPublishedListingReaderSUT();
    await sut.givenListing({
      place: BARLA,
      open: { from: '2026-10-01', to: '2026-10-31' },
      status: ListingStatus.UNPUBLISHED,
    });

    expect(await sut.whenReading(BARLA)).toEqual(null);
  });
});
