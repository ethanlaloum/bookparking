import { describe, expect, it } from 'vitest';

import { changedSettings, isWithinBounds } from './PlatformSettings';

const FEE = { min: 0, max: 50, decimals: 2 };
const EXPIRY = { min: 1, max: 96, decimals: 0 };

describe('isWithinBounds', () => {
  it.each([
    [0, FEE, true],
    [50, FEE, true],
    [12.25, FEE, true],
    [50.01, FEE, false],
    [12.345, FEE, false],
    [1, EXPIRY, true],
    [96, EXPIRY, true],
    [0, EXPIRY, false],
    [97, EXPIRY, false],
    [1.5, EXPIRY, false],
    [Number.NaN, EXPIRY, false],
  ])('%s within %o is %s', (value, bounds, expected) => {
    expect(isWithinBounds(value, bounds)).toBe(expected);
  });
});

describe('changedSettings', () => {
  it('names only the settings whose value moved, in screen order', () => {
    const before = {
      platformFeePercent: 15,
      freeCancellationHours: 24,
      requestExpiryHours: 48,
      payoutReleaseDelayHours: 24,
    };

    expect(
      changedSettings(before, { ...before, payoutReleaseDelayHours: 72, platformFeePercent: 12.5 }),
    ).toEqual(['platformFeePercent', 'payoutReleaseDelayHours']);
  });
});
