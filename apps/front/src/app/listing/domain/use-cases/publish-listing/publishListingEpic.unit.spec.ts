import { describe, it } from 'vitest';

import { createPublishListingSut } from './publishListingEpic.sut';
import type { PublishListingPayload } from '../../ports/ListingGateway';

const PAYLOAD: PublishListingPayload = {
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  accessDescription: 'Digicode 4321, deuxieme sous-sol.',
  photos: ['photo-1.jpg'],
  pricing: { dayInCents: 1500 },
  availability: { from: '2026-10-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
};

describe('publishing a listing', () => {
  it('refetches the listings because the api returns no identifier', () => {
    const sut = createPublishListingSut();
    sut.whenPublishing(PAYLOAD);
    sut.thenThePublicationSucceeded();
    sut.thenTheListingsWereRefetched(1);
  });

  it('shows the api message and refetches nothing when the place already has a listing', () => {
    const sut = createPublishListingSut();
    sut.givenTheApiRejectsWith('Cette place a deja une annonce active');
    sut.whenPublishing(PAYLOAD);
    sut.thenTheErrorShownIs('Cette place a deja une annonce active');
    sut.thenTheListingsWereRefetched(0);
  });
});
