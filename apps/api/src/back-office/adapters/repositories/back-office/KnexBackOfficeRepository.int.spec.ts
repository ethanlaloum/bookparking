import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexBackOfficeRepositorySUT } from './KnexBackOfficeRepository.sut';

describe('KnexBackOfficeRepository @SPEC-004', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('owes the renter a full refund when a confirmed request is cancelled @EX-004-30', async () => {
    const sut = createKnexBackOfficeRepositorySUT();
    const requestId = await sut.givenLeaRequestConfirmedAndCaptured();

    const cancelled = await sut.whenTheOperatorCancels(requestId);

    expect(cancelled).toEqual(true);
    await sut.thenStoredRowIs(requestId, {
      status: 'CANCELLED',
      money: 'REFUND_DUE',
    });
  });

  it('owes the renter a release when a request awaiting the owner is cancelled @EX-004-31', async () => {
    const sut = createKnexBackOfficeRepositorySUT();
    const requestId = await sut.givenLeaRequestWithHoldPlaced();

    const cancelled = await sut.whenTheOperatorCancels(requestId);

    expect(cancelled).toEqual(true);
    await sut.thenStoredRowIs(requestId, {
      status: 'CANCELLED',
      money: 'RELEASE_DUE',
    });
  });

  it('owes nothing when a request made before payments is cancelled @EX-004-32', async () => {
    const sut = createKnexBackOfficeRepositorySUT();
    const requestId = await sut.givenLeaRequestConfirmedBeforePayments();

    const cancelled = await sut.whenTheOperatorCancels(requestId);

    expect(cancelled).toEqual(true);
    await sut.thenStoredRowIs(requestId, {
      status: 'CANCELLED',
      money: 'NONE',
    });
  });
});
