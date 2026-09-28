import { describe, expect, it } from 'vitest';

import { buildInMemoryDependencies } from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import { confirmArrivalRequested } from './confirmArrivalEpic';

describe('confirming the arrival', () => {
  it('tells the api, then reads the bookings again to show it', () => {
    const dependencies = buildInMemoryDependencies();
    const store = createTestStore(dependencies);

    store.dispatch(confirmArrivalRequested({ requestId: 'reservation-1' }));

    expect(dependencies.rentalGateway.arrivals).toEqual(['reservation-1']);
    expect(dependencies.rentalGateway.listMineCallCount).toEqual(1);
  });
});
