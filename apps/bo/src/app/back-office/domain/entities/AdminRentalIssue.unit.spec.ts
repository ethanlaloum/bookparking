import { describe, expect, it } from 'vitest';

import { anAdminRentalIssue } from '../../../../store/testing/InMemoryDependencies';
import { isAcceptablePartialRefund, maximumPartialRefundInCents } from './AdminRentalIssue';

describe('a partial refund', () => {
  const issue = anAdminRentalIssue({ ownerShareInCents: 3825 });

  it('is taken from the owner share, and leaves the owner one cent at least', () => {
    expect(maximumPartialRefundInCents(issue)).toEqual(3824);
  });

  it.each([
    [1, true],
    [3824, true],
    [0, false],
    [3825, false],
    [12.5, false],
  ])('of %s cents is acceptable: %s', (cents, expected) => {
    expect(isAcceptablePartialRefund(issue, cents)).toBe(expected);
  });
});
