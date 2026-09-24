import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { AccountNotFoundError } from '../../errors/AccountNotFoundError';
import { createChooseAvatarSUT } from './ChooseAvatar.sut';

const LEA = {
  id: '7c2e5b1a-4d3f-4a8e-9b6c-2e1f0a9d8c7b',
  email: 'lea.t@example.com',
  avatar: 'SIGNAL' as const,
};
const MARC = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  email: 'marc.d@example.com',
  avatar: 'SIGNAL' as const,
};

describe('ChooseAvatar', () => {
  it('changes the avatar of the signed-in account, and of no other', async () => {
    const sut = createChooseAvatarSUT();
    sut.givenAccount(LEA);
    sut.givenAccount(MARC);

    const result = await sut.whenChoosing(LEA.id, 'CHECKERED');

    sut.thenResultIsRight(result);
    sut.thenAvatarOfIs(LEA.id, 'CHECKERED');
    sut.thenAvatarOfIs(MARC.id, 'SIGNAL');
  });

  it('refuses a token whose account no longer exists', async () => {
    const sut = createChooseAvatarSUT();
    sut.givenAccount(MARC);

    const result = await sut.whenChoosing(LEA.id, 'CHECKERED');

    sut.thenResultIsLeftWithError(result, AccountNotFoundError);
    sut.thenAvatarOfIs(MARC.id, 'SIGNAL');
  });

  it('converts a repository failure into an unknown error', async () => {
    const sut = createChooseAvatarSUT();
    sut.givenAccount(LEA);
    sut.givenAccountRepositoryFails();

    const result = await sut.whenChoosing(LEA.id, 'CHECKERED');

    sut.thenResultIsLeftWithError(result, UnknownError);
  });
});
