import { AccountNotFoundError } from '../../errors/AccountNotFoundError';
import { createReadOwnAccountSUT } from './ReadOwnAccount.sut';

const LEA = {
  id: '7c2e5b1a-4d3f-4a8e-9b6c-2e1f0a9d8c7b',
  email: 'lea.t@example.com',
  avatar: 'RIVIERA' as const,
};
const MARC = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  email: 'marc.d@example.com',
  avatar: 'CHECKERED' as const,
};

describe('ReadOwnAccount', () => {
  it('reads the signed-in account', async () => {
    const sut = createReadOwnAccountSUT();
    sut.givenAccount(MARC);
    sut.givenAccount(LEA);

    const result = await sut.whenReading(LEA.id);

    sut.thenAccountReadIs(result, LEA);
  });

  it('refuses a token whose account no longer exists', async () => {
    const sut = createReadOwnAccountSUT();
    sut.givenAccount(MARC);

    const result = await sut.whenReading(LEA.id);

    sut.thenResultIsLeftWithError(result, AccountNotFoundError);
  });
});
