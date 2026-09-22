import { describe, it } from 'vitest';

import { createListAccountsSut } from './listAccountsEpic.sut';

describe('la liste des comptes', () => {
  it('montre le plus récemment inscrit en premier et compte les suspendus', () => {
    const sut = createListAccountsSut();
    sut.givenTheApiHolds([
      sut.anAdminAccount({
        id: 'a',
        email: 'ancienne@example.com',
        registeredAt: '2026-01-01T00:00:00.000Z',
      }),
      sut.anAdminAccount({
        id: 'b',
        email: 'recente@example.com',
        registeredAt: '2026-09-01T00:00:00.000Z',
      }),
      sut.anAdminAccount({
        id: 'c',
        email: 'suspendue@example.com',
        registeredAt: '2026-05-01T00:00:00.000Z',
        suspendedAt: '2026-09-10T00:00:00.000Z',
      }),
    ]);

    sut.whenListingAccounts();

    sut.thenTheAccountsShownAre(3);
    sut.thenTheFirstShownIs('recente@example.com');
    sut.thenTheSuspendedCountIs(1);
  });

  it("montre le message de l'api quand la liste est illisible", () => {
    const sut = createListAccountsSut();
    sut.givenTheApiRejectsWith('La liste des comptes est indisponible');

    sut.whenListingAccounts();

    sut.thenTheErrorShownIs('La liste des comptes est indisponible');
  });
});
