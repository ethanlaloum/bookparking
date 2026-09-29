import { describe, it } from 'vitest';

import { createSignInSut } from './signInEpic.sut';

const CREDENTIALS = { email: 'admin@bookparking.fr', password: 'motdepasse123' };
const SESSION = { token: 'jeton-admin', validUntil: '2099-01-01T00:00:00.000Z' };

describe('se connecter à la console', () => {
  it("ouvre la session quand l'api confirme que ce compte administre le site", () => {
    const sut = createSignInSut();
    sut.givenTheApiIssues(SESSION.token, SESSION.validUntil);

    sut.whenSigningIn(CREDENTIALS);

    sut.thenTheAccessWasProbed(1);
    sut.thenTheOpenSessionIs(SESSION);
    sut.thenTheStoredSessionIs(SESSION);
    sut.thenTheErrorShownIs(null);
  });

  it("refuse un compte que l'api ne reconnaît pas comme administrateur, sans rien garder", () => {
    const sut = createSignInSut();
    sut.givenTheApiIssues(SESSION.token, SESSION.validUntil);
    sut.givenTheAccessProbeFailsWith(
      'forbidden',
      "Cette action est réservée à l'administration du site",
    );

    sut.whenSigningIn(CREDENTIALS);

    sut.thenTheOpenSessionIs(null);
    sut.thenTheStoredSessionIs(null);
    sut.thenTheRefusalIsForANonAdmin(true);
    sut.thenTheErrorShownIs("Cette action est réservée à l'administration du site");
  });

  it("ne garde rien non plus quand la sonde tombe en panne", () => {
    const sut = createSignInSut();
    sut.givenTheAccessProbeFailsWith('other', 'Le serveur est injoignable. Vérifiez votre connexion.');

    sut.whenSigningIn(CREDENTIALS);

    sut.thenTheOpenSessionIs(null);
    sut.thenTheStoredSessionIs(null);
    sut.thenTheRefusalIsForANonAdmin(false);
    sut.thenTheErrorShownIs('Le serveur est injoignable. Vérifiez votre connexion.');
  });

  it("montre le message de l'api et ne sonde rien quand les identifiants sont refusés", () => {
    const sut = createSignInSut();
    sut.givenTheCredentialsAreRefusedWith('Adresse e-mail ou mot de passe incorrect');

    sut.whenSigningIn(CREDENTIALS);

    sut.thenTheAccessWasProbed(0);
    sut.thenTheOpenSessionIs(null);
    sut.thenTheStoredSessionIs(null);
    sut.thenTheRefusalIsForANonAdmin(false);
    sut.thenTheErrorShownIs('Adresse e-mail ou mot de passe incorrect');
  });
});
