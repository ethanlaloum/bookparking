import { estimateRentalPriceInCents, type Pricing } from './Listing';

export const createListingPricingSut = () => {
  let pricing: Pricing = { dayInCents: null, weekInCents: null, monthInCents: null };
  let estimate: number | null = null;

  return {
    givenPricing(next: Partial<Pricing>): void {
      pricing = {
        dayInCents: next.dayInCents ?? null,
        weekInCents: next.weekInCents ?? null,
        monthInCents: next.monthInCents ?? null,
      };
    },
    whenEstimatingFor(fromDay: string, toDay: string): void {
      estimate = estimateRentalPriceInCents(pricing, fromDay, toDay);
    },
    thenEstimateIs(expected: number | null): void {
      if (estimate !== expected)
        throw new Error(`Estimation attendue ${String(expected)}, obtenue ${String(estimate)}`);
    },
  };
};
