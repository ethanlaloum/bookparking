import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { EmailAlreadyUsedError } from '../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';
import { createKnexAccountRepositorySUT } from './KnexAccountRepository.sut';

const MARC_EMAIL = 'marc.d@example.com';
const MARC_EMAIL_CASED = 'Marc.D@Example.COM';
const MARC_EMAIL_SPACED = ' marc.d@example.com ';
const UNKNOWN_EMAIL = 'inconnu@example.com';

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
  it('reads an account back by its address whatever its casing @EX-002-43', async () => {
    const sut = createKnexAccountRepositorySUT();
    await sut.whenWritingAccountFor(MARC_EMAIL_CASED);

    const found = await sut.whenReadingAccountFor(MARC_EMAIL_SPACED);
    const missing = await sut.whenReadingAccountFor(UNKNOWN_EMAIL);

    await sut.thenFoundAccountIsTheStoredOneFor(found, MARC_EMAIL);
    sut.thenNoAccountFound(missing);
  });
});
