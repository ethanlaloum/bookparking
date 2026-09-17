import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexListingRepositorySUT } from './KnexListingRepository.sut';

describe('KnexListingRepository @SPEC-001', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('leaves no partial listing when photo storage fails @EX-001-19', async () => {
    const sut = createKnexListingRepositorySUT();
    sut.givenPhotoStorageFailingOnEveryUpload();

    await sut.whenPublishing({
      owner: 'Marc D.',
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      accessDescription:
        'portail bleu à gauche du 12, le box est au fond du premier sous-sol',
      photos: ['photo-1'],
      pricing: { day: 1200, week: 6000, month: 18000 },
      availability: { from: '2026-10-01', to: '2026-10-31' },
      publishedAt: '2026-09-10',
    });

    await sut.thenNoListingRow({
      address: '12 rue Barla, 06300 Nice',
      box: '12',
    });
  });
});
