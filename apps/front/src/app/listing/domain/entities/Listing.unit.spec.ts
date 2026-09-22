import { describe, expect, it } from 'vitest';

import { createListingPricingSut } from './Listing.sut';
import { cheapestNightlyRateInCents, dayCountOf, isListingAvailableOn } from './Listing';
import { aListing } from '../../../../store/testing/InMemoryDependencies';

describe('the rental price estimate', () => {
  it('charges one daily rate per day when only a daily rate exists', () => {
    const sut = createListingPricingSut();
    sut.givenPricing({ dayInCents: 1500 });
    sut.whenEstimatingFor('2026-10-01', '2026-10-03');
    sut.thenEstimateIs(4500);
  });

  it('prefers the weekly rate over seven daily rates when it is cheaper', () => {
    const sut = createListingPricingSut();
    sut.givenPricing({ dayInCents: 1500, weekInCents: 8000 });
    sut.whenEstimatingFor('2026-10-01', '2026-10-07');
    sut.thenEstimateIs(8000);
  });

  it('combines a weekly rate and daily rates to cover ten days', () => {
    const sut = createListingPricingSut();
    sut.givenPricing({ dayInCents: 1500, weekInCents: 8000 });
    sut.whenEstimatingFor('2026-10-01', '2026-10-10');
    sut.thenEstimateIs(12500);
  });

  it('finds no price when no tier can cover the period exactly', () => {
    const sut = createListingPricingSut();
    sut.givenPricing({ weekInCents: 8000 });
    sut.whenEstimatingFor('2026-10-01', '2026-10-03');
    sut.thenEstimateIs(null);
  });

  it('charges one monthly rate for a calendar month rather than thirty daily rates', () => {
    const sut = createListingPricingSut();
    sut.givenPricing({ dayInCents: 1500, monthInCents: 25000 });
    sut.whenEstimatingFor('2026-10-01', '2026-10-31');
    sut.thenEstimateIs(25000);
  });

  it('finds no price when the pricing grid is empty', () => {
    const sut = createListingPricingSut();
    sut.givenPricing({});
    sut.whenEstimatingFor('2026-10-01', '2026-10-02');
    sut.thenEstimateIs(null);
  });
});

describe('a listing', () => {
  it('counts both bounds of a period as rented days', () => {
    expect(dayCountOf('2026-10-01', '2026-10-03')).toBe(3);
  });

  it('accepts a period that its availability window contains', () => {
    expect(isListingAvailableOn(aListing(), '2026-10-05', '2026-10-09')).toBe(true);
  });

  it('refuses a period that ends after its availability window', () => {
    expect(isListingAvailableOn(aListing(), '2026-12-20', '2027-01-05')).toBe(false);
  });

  it('reads its cheapest nightly rate from the weekly tier when that tier wins', () => {
    const pricing = { dayInCents: 1500, weekInCents: 7000, monthInCents: null };
    expect(cheapestNightlyRateInCents(pricing)).toBe(1000);
  });
});
