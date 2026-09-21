import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { EmailAlreadyUsedError } from '../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';
import { createKnexAccountRepositorySUT } from './KnexAccountRepository.sut';

const MARC_EMAIL = 'marc.d@example.com';

describe('KnexAccountRepository @SPEC-002', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('keeps a single account when the same address is written twice @EX-002-03', async () => {
    const sut = createKnexAccountRepositorySUT();

    const firstWrite = await sut.whenWritingAccountFor(MARC_EMAIL);
    const secondWrite = await sut.whenWritingAccountFor(MARC_EMAIL);

    sut.thenWriteSucceeded(firstWrite);
    sut.thenWriteFailedWith(secondWrite, EmailAlreadyUsedError);
    await sut.thenAccountsTableHasOneRowFor(MARC_EMAIL);
  });
});
