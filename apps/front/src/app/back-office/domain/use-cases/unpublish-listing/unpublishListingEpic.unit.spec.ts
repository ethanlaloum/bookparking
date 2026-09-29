import { describe, it } from 'vitest';

import { createUnpublishListingSut } from './unpublishListingEpic.sut';

const MOTIF = 'Annonce en doublon signalée par le propriétaire';

describe("dépublier l'annonce de quelqu'un d'autre", () => {
  it('transmet le motif, puis relit la liste et le tableau de bord', () => {
    const sut = createUnpublishListingSut();

    sut.whenModerating('annonce-1', MOTIF);

    sut.thenTheApiWasAskedTo({
      action: 'unpublishListing',
      targetId: 'annonce-1',
      reason: MOTIF,
    });
    sut.thenItSucceeded();
    sut.thenTheListWasRefetched(1);
    sut.thenTheDashboardWasRefetched(1);
  });

  it('honore deux dépublications de suite, sans en perdre une en route', () => {
    const sut = createUnpublishListingSut();

    sut.whenModerating('annonce-1', MOTIF);
    sut.whenModerating('annonce-2', MOTIF);

    sut.thenTheActionsSentAre(2);
    sut.thenTheListWasRefetched(2);
  });

  it("montre le message de l'api quand le motif est refusé", () => {
    const sut = createUnpublishListingSut();
    sut.givenTheApiRejectsWith(
      'refused',
      'Une action de modération exige un motif d’au moins 10 caractères',
    );

    sut.whenModerating('annonce-1', 'trop court');

    sut.thenTheErrorShownIs('Une action de modération exige un motif d’au moins 10 caractères');
    sut.thenTheListWasRefetched(0);
  });

  it("oublie l'échec quand la modale se referme", () => {
    const sut = createUnpublishListingSut();
    sut.givenTheApiRejectsWith('not-found', 'Cet élément est introuvable');
    sut.whenModerating('annonce-disparue', MOTIF);

    sut.whenTheDialogCloses();

    sut.thenNoErrorRemains();
  });

  it("coupe l'accès quand l'api répond que ce compte n'administre rien", () => {
    const sut = createUnpublishListingSut();
    sut.givenTheApiRejectsWith(
      'forbidden',
      "Cette action est réservée à l'administration du site",
    );

    sut.whenModerating('annonce-1', MOTIF);

    sut.thenTheAccessIs('denied');
  });
});
