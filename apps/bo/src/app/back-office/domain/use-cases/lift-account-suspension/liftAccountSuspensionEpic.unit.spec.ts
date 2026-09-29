import { describe, it } from 'vitest';

import { createLiftAccountSuspensionSut } from './liftAccountSuspensionEpic.sut';

const MOTIF = 'Signalement levé après vérification des pièces';

describe('lever la suspension d’un compte', () => {
  it('exige un motif comme les trois autres actions, et relit la liste', () => {
    const sut = createLiftAccountSuspensionSut();

    sut.whenModerating('compte-1', MOTIF);

    sut.thenTheApiWasAskedTo({
      action: 'liftAccountSuspension',
      targetId: 'compte-1',
      reason: MOTIF,
    });
    sut.thenItSucceeded();
    sut.thenTheListWasRefetched(1);
    sut.thenTheDashboardWasRefetched(1);
  });

  it("montre le message de l'api quand le motif est refusé", () => {
    const sut = createLiftAccountSuspensionSut();
    sut.givenTheApiRejectsWith(
      'refused',
      'Une action de modération exige un motif d’au moins 10 caractères',
    );

    sut.whenModerating('compte-1', 'court');

    sut.thenTheErrorShownIs('Une action de modération exige un motif d’au moins 10 caractères');
  });
});
