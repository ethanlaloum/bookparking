import { createModerationSut } from '../../../../../store/testing/createModerationSut';
import { liftAccountSuspensionRequested } from './liftAccountSuspensionEpic';

export const createLiftAccountSuspensionSut = () =>
  createModerationSut(liftAccountSuspensionRequested, (gateway) => gateway.listAccountsCallCount);
