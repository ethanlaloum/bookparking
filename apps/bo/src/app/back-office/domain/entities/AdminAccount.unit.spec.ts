import { describe, expect, it } from 'vitest';

import { hasNoActivity, isSuspended } from './AdminAccount';
import { anAdminAccount } from '../../../../store/testing/InMemoryDependencies';

describe("l'état d'un compte vu de l'administration", () => {
  it("lit la suspension sur la date, parce que `null` est le seul « non suspendu »", () => {
    expect(isSuspended(anAdminAccount({ suspendedAt: null }))).toBe(false);
    expect(isSuspended(anAdminAccount({ suspendedAt: '2026-09-10T00:00:00.000Z' }))).toBe(true);
  });

  it('ne dit « sans activité » que si les deux compteurs sont à zéro', () => {
    expect(hasNoActivity(anAdminAccount({ listingCount: 0, requestCount: 0 }))).toBe(true);
    expect(hasNoActivity(anAdminAccount({ listingCount: 0, requestCount: 1 }))).toBe(false);
    expect(hasNoActivity(anAdminAccount({ listingCount: 1, requestCount: 0 }))).toBe(false);
  });
});
