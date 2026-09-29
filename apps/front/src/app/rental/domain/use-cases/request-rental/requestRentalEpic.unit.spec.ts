import { describe, it } from 'vitest';

import { createRequestRentalSut } from './requestRentalEpic.sut';

const PAYLOAD = {
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  fromDay: '2026-10-01',
  toDay: '2026-10-03',
};

describe('requesting a rental', () => {
  it('keeps the submitted period because the api returns no identifier', () => {
    const sut = createRequestRentalSut();
    sut.whenRequesting(PAYLOAD);
    sut.thenTheRequestSucceeded();
    sut.thenTheSubmittedPeriodIsKept('2026-10-01', '2026-10-03');
  });

  it('shows the api message when the dates are already rented', () => {
    const sut = createRequestRentalSut();
    sut.givenTheApiRejectsWith('Ces dates sont deja louees');
    sut.whenRequesting(PAYLOAD);
    sut.thenTheErrorShownIs('Ces dates sont deja louees');
  });
});
