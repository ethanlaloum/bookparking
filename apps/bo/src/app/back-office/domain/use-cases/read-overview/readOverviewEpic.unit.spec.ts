import { describe, it } from 'vitest';

import { createReadOverviewSut } from './readOverviewEpic.sut';

describe('le tableau de bord de trois blocs', () => {
  it("montre ce que l'api compte et accorde l'accès", () => {
    const sut = createReadOverviewSut();
    sut.givenTheApiHolds(sut.anOverview({ counts: { confirmedRevenueInCents: 123_400 } }));

    sut.whenReadingTheDashboard();

    sut.thenTheRevenueShownInCentsIs(123_400);
    sut.thenTheAccessIs('granted');
  });

  it("ne signale le bloc « à surveiller » que s'il y a quelque chose à surveiller", () => {
    const calme = createReadOverviewSut();
    calme.givenTheApiHolds(calme.anOverview());
    calme.whenReadingTheDashboard();
    calme.thenTheBlockIsFlagged(false);

    const alerte = createReadOverviewSut();
    alerte.givenTheApiHolds(alerte.anOverview({ attention: { requestsPendingOverADay: 2 } }));
    alerte.whenReadingTheDashboard();
    alerte.thenTheBlockIsFlagged(true);
  });

  it("refuse l'accès sur un 403, seul signal que l'api donne sur ce droit", () => {
    const sut = createReadOverviewSut();
    sut.givenTheApiRejectsWith(
      'forbidden',
      "Cette action est réservée à l'administration du site",
    );

    sut.whenReadingTheDashboard();

    sut.thenTheAccessIs('denied');
    sut.thenNothingIsShown();
  });

  it("laisse l'accès indéterminé quand la panne n'est pas un refus de droit", () => {
    const sut = createReadOverviewSut();
    sut.givenTheApiRejectsWith('other', 'Le serveur est injoignable. Vérifiez votre connexion.');

    sut.whenReadingTheDashboard();

    sut.thenTheErrorShownIs('Le serveur est injoignable. Vérifiez votre connexion.');
    sut.thenTheAccessIs('unknown');
  });
});
