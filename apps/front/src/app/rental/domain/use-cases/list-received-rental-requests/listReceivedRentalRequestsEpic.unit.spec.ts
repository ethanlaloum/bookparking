import { describe, it } from 'vitest';

import { createListReceivedRentalRequestsSut } from './listReceivedRentalRequestsEpic.sut';

describe('listing the requests received on your places', () => {
  it('shows what the api holds and totals the confirmed ones as revenue', () => {
    const sut = createListReceivedRentalRequestsSut();
    sut.givenTheApiHolds([
      sut.aRentalRequestView({ id: 'a', status: 'CONFIRMED', priceInCents: 4500 }),
      sut.aRentalRequestView({ id: 'b', status: 'PENDING', priceInCents: 9900 }),
      sut.aRentalRequestView({ id: 'c', status: 'EXPIRED', priceInCents: 7000 }),
    ]);

    sut.whenListingReceivedRequests();

    sut.thenTheRequestsShownAre(3);
    sut.thenTheRevenueInCentsIs(4500);
  });

  it('shows the api message when the list cannot be read', () => {
    const sut = createListReceivedRentalRequestsSut();
    sut.givenTheApiRejectsWith('La liste des demandes reçues est indisponible');

    sut.whenListingReceivedRequests();

    sut.thenTheErrorShownIs('La liste des demandes reçues est indisponible');
  });

  it('refetches the list after a confirmation, because the api answers without a body', () => {
    const sut = createListReceivedRentalRequestsSut();
    sut.givenTheApiHolds([sut.aRentalRequestView({ id: 'a' })]);

    sut.whenListingReceivedRequests();
    sut.whenConfirming('a');

    sut.thenTheListWasRefetched(2);
  });
});
