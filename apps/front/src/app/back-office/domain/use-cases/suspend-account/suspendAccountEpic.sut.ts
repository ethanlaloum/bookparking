import { createModerationSut } from '../../../../../store/testing/createModerationSut';
import { suspendAccountRequested } from './suspendAccountEpic';

export const createSuspendAccountSut = () =>
  createModerationSut(suspendAccountRequested, (gateway) => gateway.listAccountsCallCount);
