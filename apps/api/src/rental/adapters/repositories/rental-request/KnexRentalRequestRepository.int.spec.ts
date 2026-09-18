import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexRentalRequestRepositorySUT } from './KnexRentalRequestRepository.sut';

const PLACE = { address: '12 rue Barla, 06300 Nice', box: '12' };
const NOVEMBER = { from: '2026-11-05', to: '2026-11-12' };

describe('KnexRentalRequestRepository @SPEC-001', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('records only one of two simultaneous requests for the same dates @EX-001-30', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });

    const outcomes = await sut.whenBothRequestAtOnce(
      { renter: 'Léa T.', ...PLACE, ...NOVEMBER },
      { renter: 'Karim B.', ...PLACE, ...NOVEMBER },
    );

    await sut.thenExactlyOneRequestRowExistsFor({ ...PLACE, ...NOVEMBER });
    sut.thenExactlyOneOutcomeIsRefusedForUnavailableDates(outcomes);
  });

  it('records no request that races an unpublishing @EX-001-32', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });

    const outcomes = await sut.whenRequestingWhileUnpublishing(
      { renter: 'Léa T.', ...PLACE, ...NOVEMBER },
      { owner: 'Marc D.', ...PLACE },
    );

    sut.thenRequestIsRefused(outcomes);
    sut.thenUnpublicationSucceeded(outcomes);
    await sut.thenStoredListingIsUnpublished(PLACE);
    await sut.thenNoRequestRowExistsFor({ ...PLACE, ...NOVEMBER });
  });
});
