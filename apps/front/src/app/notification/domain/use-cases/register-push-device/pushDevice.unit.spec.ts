import { describe, it } from 'vitest';

import { createPushDeviceSut } from './pushDevice.sut';

const PHONE = 'ExponentPushToken[marc-iphone]';

describe('the phone that receives the pushes', () => {
  it('is handed to the api with its token', () => {
    const sut = createPushDeviceSut();
    sut.givenSignedIn();

    sut.whenThePhoneHandsItsToken(PHONE);

    sut.thenTheApiRegistered([PHONE]);
  });

  it('is forgotten on sign-out, so the next person on it reads nothing of the account', () => {
    const sut = createPushDeviceSut();
    sut.givenSignedIn();
    sut.whenThePhoneHandsItsToken(PHONE);

    sut.whenSigningOut();

    sut.thenTheApiForgot([PHONE]);
    sut.thenSignedOut();
  });

  it('is forgotten once, not again on a second sign-out', () => {
    const sut = createPushDeviceSut();
    sut.givenSignedIn();
    sut.whenThePhoneHandsItsToken(PHONE);
    sut.whenSigningOut();

    sut.whenSigningOut();

    sut.thenTheApiForgot([PHONE]);
  });

  it('asks the api to forget nothing when no phone was handed, as on the site', () => {
    const sut = createPushDeviceSut();
    sut.givenSignedIn();

    sut.whenSigningOut();

    sut.thenTheApiForgot([]);
  });

  it('does not keep the account signed in when the api cannot forget the phone', () => {
    const sut = createPushDeviceSut();
    sut.givenSignedIn();
    sut.whenThePhoneHandsItsToken(PHONE);
    sut.givenTheApiRejectsPhonesWith('Erreur réseau');

    sut.whenSigningOut();

    sut.thenSignedOut();
  });
});
