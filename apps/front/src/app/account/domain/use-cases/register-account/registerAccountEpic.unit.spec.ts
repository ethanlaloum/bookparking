import { describe, it } from 'vitest';

import { createRegisterAccountSut } from './registerAccountEpic.sut';

const PAYLOAD = {
  email: 'alice@example.com',
  password: 'motdepasse123',
  humanProof: {
    algorithm: 'SHA-256',
    challenge: 'condense',
    salt: 'sel?expires=1790000000',
    number: 7,
    signature: 'signature',
  },
  acceptsTerms: true,
  avatar: 'RIVIERA' as const,
};

describe('registering an account', () => {
  it('signs the new account in with the credentials it just submitted', () => {
    const sut = createRegisterAccountSut();
    sut.whenRegistering(PAYLOAD);
    sut.thenTheUserIsSignedIn();
    sut.thenTheCredentialsForwardedAre(PAYLOAD.email, PAYLOAD.password);
  });

  it('opens no session when the address is already taken', () => {
    const sut = createRegisterAccountSut();
    sut.givenTheApiRejectsWith('Cette adresse e-mail est deja utilisee');
    sut.whenRegistering(PAYLOAD);
    sut.thenTheUserIsNotSignedIn();
    sut.thenTheErrorShownIs('Cette adresse e-mail est deja utilisee');
  });
});
