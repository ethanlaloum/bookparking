import { IncompletePricingError } from '../publish-listing/errors/IncompletePricingError';
import { createUpdateListingPricingSUT } from './UpdateListingPricing.sut';

const PLACE = { address: '12 rue Barla, 06300 Nice', box: '12' };

describe('UpdateListingPricing @SPEC-001', () => {
  it("refuses removing the last duration from a published listing's pricing @EX-001-24", async () => {
    const sut = createUpdateListingPricingSUT();
    sut.givenActiveListing({
      owner: 'Marc D.',
      ...PLACE,
      pricing: { day: null, week: null, month: 18000 },
    });

    const result = await sut.whenUpdatingPricing({
      owner: 'Marc D.',
      ...PLACE,
      pricing: { day: null, week: null, month: null },
      updatedAt: '2026-09-12',
    });

    sut.thenUpdateIsRefusedWith(result, IncompletePricingError);
    sut.thenRefusalMessageIs(result, 'La grille tarifaire est incomplète');
    sut.thenActiveListingPricingIs(PLACE, {
      day: null,
      week: null,
      month: 18000,
    });
  });
});
