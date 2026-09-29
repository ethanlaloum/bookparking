import { describe, it } from 'vitest';

import { createRequestPasswordResetSut } from './requestPasswordResetEpic.sut';

describe('requesting a password reset', () => {
  it('sends the address and remembers where the link went', () => {
    const sut = createRequestPasswordResetSut();

    sut.whenRequestingAResetFor('marc.d@example.com');

    sut.thenTheAddressesSentAre(['marc.d@example.com']);
    sut.thenTheScreenShows({ loading: false, error: null, sentTo: 'marc.d@example.com' });
  });

  it('shows the refusal of the api and no confirmation', () => {
    const sut = createRequestPasswordResetSut();
    sut.givenTheApiRejectsWith('Le serveur est injoignable. Vérifiez votre connexion.');

    sut.whenRequestingAResetFor('marc.d@example.com');

    sut.thenTheScreenShows({
      loading: false,
      error: 'Le serveur est injoignable. Vérifiez votre connexion.',
      sentTo: null,
    });
  });

  it('forgets the confirmation once the page is left', () => {
    const sut = createRequestPasswordResetSut();
    sut.whenRequestingAResetFor('marc.d@example.com');

    sut.whenLeavingThePage();

    sut.thenTheScreenShows({ loading: false, error: null, sentTo: null });
  });
});
