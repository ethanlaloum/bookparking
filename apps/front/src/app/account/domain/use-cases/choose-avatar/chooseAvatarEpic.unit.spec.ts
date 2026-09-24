import { describe, it } from 'vitest';

import { createChooseAvatarSut } from './chooseAvatarEpic.sut';

const LEA = {
  id: '7c2e5b1a-4d3f-4a8e-9b6c-2e1f0a9d8c7b',
  email: 'lea.t@example.com',
  avatar: 'SIGNAL' as const,
};

describe('choosing an avatar', () => {
  it('sends the chosen driver and shows it at once', () => {
    const sut = createChooseAvatarSut();
    sut.givenTheSignedInAccountIs(LEA);

    sut.whenChoosing('CHECKERED');

    sut.thenTheAvatarSentIs('CHECKERED');
    sut.thenTheAvatarShownIs('CHECKERED');
    sut.thenTheErrorShownIs(null);
  });

  it('shows the chosen driver before the api has answered', () => {
    const sut = createChooseAvatarSut();
    sut.givenTheSignedInAccountIs(LEA);
    sut.givenTheApiHasNotAnsweredYet();

    sut.whenChoosing('CHECKERED');

    sut.thenTheAvatarShownIs('CHECKERED');
  });

  it('gives the previous driver back when the api refuses', () => {
    const sut = createChooseAvatarSut();
    sut.givenTheSignedInAccountIs(LEA);
    sut.givenTheApiRejectsWith('Le serveur est injoignable. Vérifiez votre connexion.');

    sut.whenChoosing('CHECKERED');

    sut.thenTheAvatarShownIs('SIGNAL');
    sut.thenTheErrorShownIs('Le serveur est injoignable. Vérifiez votre connexion.');
  });
});
