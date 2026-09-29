import { describe, expect, it } from 'vitest';

import {
  confirmedRevenueInCents,
  countByStatus,
  pendingRevenueInCents,
  rentedNightCount,
  type RentalRequestView,
} from './RentalRequestView';

const aRequest = (overrides: Partial<RentalRequestView> = {}): RentalRequestView => ({
  id: 'demande-1',
  listingId: 'annonce-1',
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  fromDay: '2026-10-01',
  toDay: '2026-10-03',
  priceInCents: 4500,
  status: 'PENDING',
  requestedAt: '2026-09-20T09:00:00.000Z',
  confirmedAt: null,
  ...overrides,
});

describe('the owner revenue', () => {
  it('sums only the confirmed requests', () => {
    const requests = [
      aRequest({ status: 'CONFIRMED', priceInCents: 4500 }),
      aRequest({ status: 'CONFIRMED', priceInCents: 8000 }),
      aRequest({ status: 'PENDING', priceInCents: 9900 }),
      aRequest({ status: 'EXPIRED', priceInCents: 7000 }),
    ];
    expect(confirmedRevenueInCents(requests)).toBe(12500);
  });

  it('is nothing when no request was ever confirmed', () => {
    expect(confirmedRevenueInCents([aRequest({ status: 'PENDING' })])).toBe(0);
  });

  it('counts a pending request as expected income, not as revenue', () => {
    const requests = [
      aRequest({ status: 'CONFIRMED', priceInCents: 4500 }),
      aRequest({ status: 'PENDING', priceInCents: 9900 }),
    ];
    expect(confirmedRevenueInCents(requests)).toBe(4500);
    expect(pendingRevenueInCents(requests)).toBe(9900);
  });

  it('leaves an expired request out of both totals', () => {
    const requests = [aRequest({ status: 'EXPIRED', priceInCents: 7000 })];
    expect(confirmedRevenueInCents(requests)).toBe(0);
    expect(pendingRevenueInCents(requests)).toBe(0);
  });
});

describe('a rental request', () => {
  it('counts both bounds of its period as rented nights', () => {
    expect(rentedNightCount(aRequest({ fromDay: '2026-10-01', toDay: '2026-10-03' }))).toBe(3);
  });

  it('counts a single day as one night', () => {
    expect(rentedNightCount(aRequest({ fromDay: '2026-10-01', toDay: '2026-10-01' }))).toBe(1);
  });
});

describe('the request counts', () => {
  it('tallies every status, including those with nothing', () => {
    const requests = [
      aRequest({ status: 'PENDING' }),
      aRequest({ status: 'PENDING' }),
      aRequest({ status: 'CONFIRMED' }),
    ];
    expect(countByStatus(requests)).toEqual({ PENDING: 2, CONFIRMED: 1, EXPIRED: 0 });
  });
});
