import { describe, it } from 'vitest';

import { createChooseNewPasswordSut } from './chooseNewPasswordEpic.sut';

const RESET = { token: 'token-1', newPassword: 'Promenade2027#' };

describe('choosing a new password', () => {
  it('sends the link and the new password, and reports the success', () => {
    const sut = createChooseNewPasswordSut();

    sut.whenChoosing(RESET);

    sut.thenTheResetsSentAre([RESET]);
    sut.thenTheScreenShows({ loading: false, error: null, success: true });
  });

  it('shows the refusal of a link that is no longer valid', () => {
    const sut = createChooseNewPasswordSut();
    sut.givenTheApiRejectsWith(
      "Ce lien de réinitialisation n'est plus valable. Demandez-en un nouveau.",
    );

    sut.whenChoosing(RESET);

    sut.thenTheScreenShows({
      loading: false,
      error: "Ce lien de réinitialisation n'est plus valable. Demandez-en un nouveau.",
      success: false,
    });
  });

  it('forgets the outcome once the page is left', () => {
    const sut = createChooseNewPasswordSut();
    sut.whenChoosing(RESET);

    sut.whenLeavingThePage();

    sut.thenTheScreenShows({ loading: false, error: null, success: false });
  });
});
