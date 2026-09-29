import { describe, it } from 'vitest';

import { createReadRentalTermsSut } from './readRentalTermsEpic.sut';

const TERMS = {
  platformFeePercent: 12.5,
  freeCancellationHours: 48,
  requestExpiryHours: 24,
  payoutReleaseDelayHours: 72,
};

describe('the rental terms in force', () => {
  it('shows the values the back office set, not figures written in the page', () => {
    const sut = createReadRentalTermsSut();
    sut.givenTheApiHolds(TERMS);

    sut.whenReading();

    sut.thenTheTermsShownAre(TERMS);
    sut.thenTheErrorShownIs(null);
  });

  it('shows the api message and no figure when the terms cannot be read', () => {
    const sut = createReadRentalTermsSut();
    sut.givenTheApiRejectsWith('Le serveur est injoignable. Vérifiez votre connexion.');

    sut.whenReading();

    sut.thenTheTermsShownAre(null);
    sut.thenTheErrorShownIs('Le serveur est injoignable. Vérifiez votre connexion.');
  });

  it('keeps the terms after a sign-out, since every visitor reads the same', () => {
    const sut = createReadRentalTermsSut();
    sut.givenTheApiHolds(TERMS);
    sut.whenReading();

    sut.whenSigningOut();

    sut.thenTheTermsShownAre(TERMS);
  });
});
