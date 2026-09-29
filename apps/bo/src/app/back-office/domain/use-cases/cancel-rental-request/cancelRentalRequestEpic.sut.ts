import { createModerationSut } from '../../../../../store/testing/createModerationSut';
import { cancelRentalRequestRequested } from './cancelRentalRequestEpic';

export const createCancelRentalRequestSut = () =>
  createModerationSut(
    cancelRentalRequestRequested,
    (gateway) => gateway.listRentalRequestsCallCount,
  );
