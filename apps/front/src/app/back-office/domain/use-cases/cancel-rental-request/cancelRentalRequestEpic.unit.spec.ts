import { describe, it } from 'vitest';

import { createCancelRentalRequestSut } from './cancelRentalRequestEpic.sut';

const MOTIF = 'Place indisponible, le propriétaire a prévenu par téléphone';

describe('annuler une demande de location', () => {
  it('transmet le motif, puis relit la liste et le tableau de bord', () => {
    const sut = createCancelRentalRequestSut();

    sut.whenModerating('demande-1', MOTIF);

    sut.thenTheApiWasAskedTo({
      action: 'cancelRentalRequest',
      targetId: 'demande-1',
      reason: MOTIF,
    });
    sut.thenItSucceeded();
    sut.thenTheListWasRefetched(1);
    sut.thenTheDashboardWasRefetched(1);
  });

  it("montre le message de l'api quand la demande n'est plus annulable", () => {
    const sut = createCancelRentalRequestSut();
    sut.givenTheApiRejectsWith('not-found', 'Cet élément est introuvable');

    sut.whenModerating('demande-expiree', MOTIF);

    sut.thenTheErrorShownIs('Cet élément est introuvable');
    sut.thenTheListWasRefetched(0);
  });
});
