import { describe, it } from 'vitest';

import { createSuspendAccountSut } from './suspendAccountEpic.sut';

const MOTIF = 'Plusieurs annonces frauduleuses signalées';

describe('suspendre un compte', () => {
  it('transmet le motif, puis relit la liste et le tableau de bord', () => {
    const sut = createSuspendAccountSut();

    sut.whenModerating('compte-1', MOTIF);

    sut.thenTheApiWasAskedTo({
      action: 'suspendAccount',
      targetId: 'compte-1',
      reason: MOTIF,
    });
    sut.thenItSucceeded();
    sut.thenTheListWasRefetched(1);
    sut.thenTheDashboardWasRefetched(1);
  });

  it("montre le message de l'api quand elle refuse", () => {
    const sut = createSuspendAccountSut();
    sut.givenTheApiRejectsWith('not-found', 'Cet élément est introuvable');

    sut.whenModerating('compte-disparu', MOTIF);

    sut.thenTheErrorShownIs('Cet élément est introuvable');
    sut.thenTheListWasRefetched(0);
  });
});
