import { describe, it } from 'vitest';

import { createListRentalRequestsSut } from './listRentalRequestsEpic.sut';

const MAINTENANT = new Date('2026-09-22T12:00:00.000Z');

describe('la liste des demandes de location', () => {
  it('montre la plus récente en premier', () => {
    const sut = createListRentalRequestsSut();
    sut.givenTheApiHolds([
      sut.anAdminRentalRequest({ id: 'ancienne', requestedAt: '2026-09-01T00:00:00.000Z' }),
      sut.anAdminRentalRequest({ id: 'recente', requestedAt: '2026-09-20T00:00:00.000Z' }),
    ]);

    sut.whenListingRentalRequests();

    sut.thenTheRequestsShownAre(2);
    sut.thenTheFirstShownIs('recente');
  });

  it("ne retient en souffrance qu'une demande encore en attente depuis plus d'un jour", () => {
    const sut = createListRentalRequestsSut();
    sut.givenTheApiHolds([
      // Vingt-cinq heures d'attente : c'est elle, et elle seule.
      sut.anAdminRentalRequest({ id: 'en-souffrance', requestedAt: '2026-09-21T11:00:00.000Z' }),
      // Une heure : encore fraîche.
      sut.anAdminRentalRequest({ id: 'fraiche', requestedAt: '2026-09-22T11:00:00.000Z' }),
      // Aussi vieille que la première, mais déjà confirmée : plus rien à faire.
      sut.anAdminRentalRequest({
        id: 'confirmee',
        status: 'CONFIRMED',
        requestedAt: '2026-09-21T11:00:00.000Z',
        confirmedAt: '2026-09-21T12:00:00.000Z',
      }),
    ]);

    sut.whenListingRentalRequests();

    sut.thenTheOnesWaitingOverADayAre(1, MAINTENANT);
  });

  it("n'offre l'annulation qu'aux demandes que l'api accepte encore d'annuler", () => {
    const sut = createListRentalRequestsSut();
    sut.givenTheApiHolds([
      sut.anAdminRentalRequest({ id: 'attente', status: 'PENDING' }),
      sut.anAdminRentalRequest({ id: 'confirmee', status: 'CONFIRMED' }),
      sut.anAdminRentalRequest({ id: 'expiree', status: 'EXPIRED' }),
      sut.anAdminRentalRequest({ id: 'annulee', status: 'CANCELLED' }),
    ]);

    sut.whenListingRentalRequests();

    sut.thenTheCancellableOnesAre(2);
  });

  it("montre le message de l'api quand la liste est illisible", () => {
    const sut = createListRentalRequestsSut();
    sut.givenTheApiRejectsWith('La liste des demandes est indisponible');

    sut.whenListingRentalRequests();

    sut.thenTheErrorShownIs('La liste des demandes est indisponible');
  });
});
