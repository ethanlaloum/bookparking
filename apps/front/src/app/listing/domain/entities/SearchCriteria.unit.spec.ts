import { describe, expect, it } from 'vitest';

import {
  criteriaFromSearchParams,
  criteriaToSearchParams,
  EMPTY_CRITERIA,
  hasAnyCriterion,
  offersTier,
  priceForTier,
  type SearchCriteria,
} from './SearchCriteria';

const MASSENA = {
  label: 'Place Masséna 06000 Nice',
  coordinates: { latitude: 43.6975, longitude: 7.2707 },
};

const FULL: SearchCriteria = { address: MASSENA, vehicle: 'suv', tier: 'week' };

const PRICING = { dayInCents: 1500, weekInCents: 8000, monthInCents: null };

describe('the pricing tier a searcher asks for', () => {
  it('reads the price of the tier it was given', () => {
    expect(priceForTier(PRICING, 'day')).toBe(1500);
    expect(priceForTier(PRICING, 'week')).toBe(8000);
  });

  it('reads nothing for a tier the listing does not offer', () => {
    expect(priceForTier(PRICING, 'month')).toBeNull();
    expect(offersTier(PRICING, 'month')).toBe(false);
  });

  it('counts a tier as offered as soon as it carries a price', () => {
    expect(offersTier(PRICING, 'week')).toBe(true);
  });
});

describe('the search criteria carried in the url', () => {
  it('survives a round trip through the query string', () => {
    const params = criteriaToSearchParams(FULL);
    expect(criteriaFromSearchParams(params)).toEqual(FULL);
  });

  it('writes nothing for a criterion nobody chose', () => {
    expect(criteriaToSearchParams(EMPTY_CRITERIA).toString()).toBe('');
  });

  it('ignores a vehicle nobody offers rather than failing', () => {
    const params = new URLSearchParams('vehicule=tracteur&duree=week');
    expect(criteriaFromSearchParams(params)).toEqual({
      address: null,
      vehicle: null,
      tier: 'week',
    });
  });

  it('ignores an address whose coordinates are missing', () => {
    const params = new URLSearchParams('adresse=Place+Mass%C3%A9na');
    expect(criteriaFromSearchParams(params).address).toBeNull();
  });

  it('keeps an address whose label carries accents and spaces', () => {
    const params = criteriaToSearchParams({ ...EMPTY_CRITERIA, address: MASSENA });
    expect(criteriaFromSearchParams(params).address).toEqual(MASSENA);
  });

  it('knows an empty search from one that asks for something', () => {
    expect(hasAnyCriterion(EMPTY_CRITERIA)).toBe(false);
    expect(hasAnyCriterion({ ...EMPTY_CRITERIA, tier: 'day' })).toBe(true);
  });
});
