import { createPushDevicesSUT } from './RegisterPushDevice.sut';

const PHONE = 'ExponentPushToken[shared-iphone]';

describe('RegisterPushDevice and ForgetPushDevice', () => {
  it('gives a phone to the last account signed in on it', async () => {
    const sut = createPushDevicesSUT();
    await sut.whenRegistering('account-marc', PHONE);

    await sut.whenRegistering('account-lea', PHONE);

    sut.thenPhonesAre({ [PHONE]: 'account-lea' });
  });

  it('stops pushing to a phone once it is forgotten on sign-out', async () => {
    const sut = createPushDevicesSUT();
    await sut.whenRegistering('account-marc', PHONE);

    await sut.whenForgetting(PHONE);

    sut.thenPhonesAre({});
  });

  it('fails when the phones cannot be written', async () => {
    const sut = createPushDevicesSUT();
    sut.givenTheDevicesAreUnreachable();

    sut.thenResultIsLeft(await sut.whenRegistering('account-marc', PHONE));
    sut.thenResultIsLeft(await sut.whenForgetting(PHONE));
  });
});
