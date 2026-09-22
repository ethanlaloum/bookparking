import { describe, it } from 'vitest';

import { createDropExpiredSessionSut } from './dropExpiredSessionEpic.sut';

describe('une session périmée ferme la console', () => {
  it('déconnecte dès le premier 401, sans attendre les autres lectures', () => {
    const sut = createDropExpiredSessionSut();
    sut.givenAnOpenSession();
    sut.givenTheApiRejectsEveryReadWith(
      'session-expired',
      'Votre session a expiré. Reconnectez-vous pour continuer.',
    );

    sut.whenTheDashboardReadsTwice();

    sut.thenTheAdminIsSignedOut();
    sut.thenTheStoredSessionWasCleared();
  });

  it("garde la session ouverte quand l'api refuse pour une autre raison", () => {
    const sut = createDropExpiredSessionSut();
    sut.givenAnOpenSession();
    sut.givenTheApiRejectsEveryReadWith(
      'forbidden',
      "Cette action est réservée à l'administration du site",
    );

    sut.whenTheDashboardReadsTwice();

    sut.thenTheAdminIsStillSignedIn();
  });
});
