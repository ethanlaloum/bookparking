import { describe, it } from 'vitest';

import { createConfirmAdminAccessSut } from './confirmAdminAccessEpic.sut';

describe("savoir si ce compte administre le site", () => {
  it('ouvre les onglets sur un 204, sans tirer les compteurs du tableau de bord', () => {
    const sut = createConfirmAdminAccessSut();

    sut.whenTheDashboardAsks();

    sut.thenTheAccessIs('granted');
    sut.thenTheDashboardWasNotRead();
  });

  it("les referme sur un 403, seul signal que l'api donne sur ce droit", () => {
    const sut = createConfirmAdminAccessSut();
    sut.givenTheApiRefusesWith(
      'forbidden',
      "Cette action est réservée à l'administration du site",
    );

    sut.whenTheDashboardAsks();

    sut.thenTheAccessIs('denied');
  });

  it("laisse l'accès indéterminé quand la panne n'est pas un refus de droit", () => {
    const sut = createConfirmAdminAccessSut();
    sut.givenTheApiRefusesWith('other', 'Le serveur est injoignable. Vérifiez votre connexion.');

    sut.whenTheDashboardAsks();

    // Un réseau coupé ne doit pas conclure qu'un administrateur n'en est pas
    // un : l'écran garde ses onglets fermés, mais rien n'est décidé.
    sut.thenTheAccessIs('unknown');
  });
});
