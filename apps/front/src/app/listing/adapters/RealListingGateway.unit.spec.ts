import { describe, it } from 'vitest';

import { createListingGatewaySut } from './RealListingGateway.sut';

const LISTING_ID = '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c';

describe('the listing gateway', () => {
  it('reads the active listings from GET /listing', async () => {
    const sut = createListingGatewaySut();
    sut.givenTheApiAnswers('GET', '/listing', [sut.aListing(), sut.aListing({ id: 'autre' })]);
    await sut.whenReadingTheActiveListings();
    sut.thenTheCallsWere([{ method: 'GET', path: '/listing' }]);
    sut.thenTheListingsReadAre(2);
  });

  it('reads one listing from GET /listing/{id}', async () => {
    const sut = createListingGatewaySut();
    sut.givenTheApiAnswers('GET', `/listing/${LISTING_ID}`, sut.aListing());
    await sut.whenReadingTheListing(LISTING_ID);
    sut.thenTheCallsWere([{ method: 'GET', path: `/listing/${LISTING_ID}` }]);
  });

  it('surfaces the api message when the listing is unknown', async () => {
    const sut = createListingGatewaySut();
    sut.givenTheApiRefuses('GET', `/listing/${LISTING_ID}`, 404, 'Annonce introuvable');
    await sut.whenReadingTheListing(LISTING_ID);
    sut.thenTheRefusalMessageIs('Annonce introuvable');
  });

  it('unpublishes through DELETE /listing/{id}', async () => {
    const sut = createListingGatewaySut();
    await sut.whenUnpublishing(LISTING_ID);
    sut.thenTheCallsWere([{ method: 'DELETE', path: `/listing/${LISTING_ID}` }]);
  });

  it('sends only the tiers it was given to PATCH /listing/{id}/pricing', async () => {
    const sut = createListingGatewaySut();
    sut.givenTheApiAnswers('PATCH', `/listing/${LISTING_ID}/pricing`, sut.aListing({
      pricing: { dayInCents: 1800, weekInCents: null, monthInCents: null },
    }));
    await sut.whenRepricing(LISTING_ID, 1800);
    sut.thenTheCallsWere([{ method: 'PATCH', path: `/listing/${LISTING_ID}/pricing` }]);
    sut.thenTheBodySentWas({ dayInCents: 1800 });
    sut.thenTheDailyPriceReadIs(1800);
  });
});
