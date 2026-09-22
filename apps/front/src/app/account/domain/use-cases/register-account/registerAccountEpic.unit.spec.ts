import { describe, it } from 'vitest';

import { createRegisterAccountSut } from './registerAccountEpic.sut';

const PAYLOAD = { email: 'alice@example.com', password: 'motdepasse123' };

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
