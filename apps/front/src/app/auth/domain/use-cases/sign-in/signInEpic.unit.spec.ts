import { describe, it } from 'vitest';

import { createSignInSut } from './signInEpic.sut';

const CREDENTIALS = { email: 'alice@example.com', password: 'motdepasse123' };

describe('signing in', () => {
  it('stores the session issued by the api', () => {
    const sut = createSignInSut();
    sut.givenTheApiIssues('jeton-alice', '2099-01-01T00:00:00.000Z');
    sut.whenSigningIn(CREDENTIALS);
    sut.thenTheSessionTokenIs('jeton-alice');
    sut.thenTheSessionIsPersisted();
  });

  it('keeps no session and shows the api message when the credentials are refused', () => {
    const sut = createSignInSut();
    sut.givenTheApiRejectsWith('Adresse e-mail ou mot de passe incorrect');
    sut.whenSigningIn(CREDENTIALS);
    sut.thenTheSessionTokenIs(null);
    sut.thenNothingIsPersisted();
    sut.thenTheErrorShownIs('Adresse e-mail ou mot de passe incorrect');
  });

  it('survives a refusal and signs in on the next attempt', () => {
    const sut = createSignInSut();
    sut.givenTheApiRejectsWith('Adresse e-mail ou mot de passe incorrect');
    sut.whenSigningIn(CREDENTIALS);
    sut.givenTheApiRejectsWith(null as unknown as string);
    sut.whenSigningIn(CREDENTIALS);
    sut.thenTheGatewaySawExactly(2);
  });
});
