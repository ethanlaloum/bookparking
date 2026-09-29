import { Either } from 'effect/index';

import { InMemoryPushDeviceRepository } from '../../../adapters/repositories/push-device/InMemoryPushDeviceRepository';
import { ForgetPushDevice } from '../forget-push-device/ForgetPushDevice';
import { RegisterPushDevice } from './RegisterPushDevice';

export const createPushDevicesSUT = () => {
  const devices = new InMemoryPushDeviceRepository();
  const registerPushDevice = new RegisterPushDevice(devices);
  const forgetPushDevice = new ForgetPushDevice(devices);

  return {
    givenTheDevicesAreUnreachable() {
      devices.enableFailureOnEveryWrite();
    },

    async whenRegistering(accountId: string, token: string) {
      return registerPushDevice.execute({
        accountId,
        token,
        registeredAt: new Date('2026-10-01T07:00:00.000Z'),
      });
    },

    async whenForgetting(token: string) {
      return forgetPushDevice.execute({ token });
    },

    thenPhonesAre(expected: Record<string, string>) {
      expect(Object.fromEntries(devices.accountIdByToken)).toEqual(expected);
    },

    thenResultIsLeft(result: Either.Either<unknown, unknown>) {
      expect(Either.isLeft(result)).toEqual(true);
    },
  };
};
