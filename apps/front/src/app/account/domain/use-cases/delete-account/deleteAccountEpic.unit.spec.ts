import { describe, it } from 'vitest';

import { createDeleteAccountSut } from './deleteAccountEpic.sut';

const SESSION = { token: 'jeton-de-lea', validUntil: '2999-01-01T00:00:00.000Z' };
const STILL_COMMITTED =
  "Une demande, une réservation ou un versement est encore en cours sur votre compte : vous pourrez le supprimer une fois qu'ils seront terminés";

describe('deleting the account', () => {
  it('sends the password, then signs out for good', () => {
    const sut = createDeleteAccountSut();
    sut.givenSignedInWith(SESSION);

    sut.whenDeleting('Promenade06!');

    sut.thenThePasswordsSentAre(['Promenade06!']);
    sut.thenTheSessionIs({ kept: null, stored: null });
    sut.thenTheScreenShows({ loading: false, error: null, deleted: true });
  });

  it('shows the refusal and keeps the session', () => {
    const sut = createDeleteAccountSut();
    sut.givenSignedInWith(SESSION);
    sut.givenTheApiRejectsWith(STILL_COMMITTED);

    sut.whenDeleting('Promenade06!');

    sut.thenTheSessionIs({ kept: SESSION, stored: SESSION });
    sut.thenTheScreenShows({ loading: false, error: STILL_COMMITTED, deleted: false });
  });

  it('forgets the deletion once someone signs in again', () => {
    const sut = createDeleteAccountSut();
    sut.givenSignedInWith(SESSION);
    sut.whenDeleting('Promenade06!');

    sut.whenSigningInAgain({ token: 'jeton-de-marc', validUntil: '2999-01-01T00:00:00.000Z' });

    sut.thenTheScreenShows({ loading: false, error: null, deleted: false });
  });

  it('forgets the refusal once the dialog is closed', () => {
    const sut = createDeleteAccountSut();
    sut.givenSignedInWith(SESSION);
    sut.givenTheApiRejectsWith('Adresse e-mail ou mot de passe incorrect');
    sut.whenDeleting('Mauvais2026!');

    sut.whenClosingTheDialog();

    sut.thenTheScreenShows({ loading: false, error: null, deleted: false });
  });
});
