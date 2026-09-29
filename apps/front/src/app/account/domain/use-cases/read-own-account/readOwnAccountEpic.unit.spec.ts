import { describe, it } from 'vitest';

import { createReadOwnAccountSut } from './readOwnAccountEpic.sut';

const LEA = {
  id: '7c2e5b1a-4d3f-4a8e-9b6c-2e1f0a9d8c7b',
  email: 'lea.t@example.com',
  avatar: 'CHECKERED' as const,
};

describe('reading the signed-in account', () => {
  it('shows the avatar chosen by the account it read', () => {
    const sut = createReadOwnAccountSut();
    sut.givenTheSignedInAccountIs(LEA);

    sut.whenTheAccountIsRead();

    sut.thenTheAvatarShownIs('CHECKERED');
    sut.thenTheEmailShownIs('lea.t@example.com');
  });

  it('keeps the generic icon when the account cannot be read', () => {
    const sut = createReadOwnAccountSut();
    sut.givenTheApiRejectsWith('Le serveur est injoignable. Vérifiez votre connexion.');

    sut.whenTheAccountIsRead();

    sut.thenTheAvatarShownIs(null);
    sut.thenTheEmailShownIs(null);
  });

  it('forgets the avatar on sign-out, so the next account does not inherit it', () => {
    const sut = createReadOwnAccountSut();
    sut.givenTheSignedInAccountIs(LEA);
    sut.whenTheAccountIsRead();

    sut.whenSigningOut();

    sut.thenTheAvatarShownIs(null);
    sut.thenTheEmailShownIs(null);
  });
});
