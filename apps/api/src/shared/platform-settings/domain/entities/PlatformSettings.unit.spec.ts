import { Either } from 'effect/index';

import {
  checkPlatformSettings,
  DEFAULT_PLATFORM_SETTINGS,
  PlatformSettings,
} from './PlatformSettings';

const refusedSettingOf = (
  overrides: Partial<PlatformSettings>,
): string | null => {
  const checked = checkPlatformSettings({
    ...DEFAULT_PLATFORM_SETTINGS,
    ...overrides,
  });
  return Either.isLeft(checked) ? checked.left.setting : null;
};

describe('checkPlatformSettings', () => {
  it.each([
    [{ platformFeePercent: 0 }],
    [{ platformFeePercent: 50 }],
    [{ platformFeePercent: 12.25 }],
    [{ freeCancellationHours: 0 }],
    [{ freeCancellationHours: 336 }],
    [{ requestExpiryHours: 1 }],
    [{ requestExpiryHours: 96 }],
    [{ payoutReleaseDelayHours: 0 }],
    [{ payoutReleaseDelayHours: 720 }],
  ])('accepts %o, on the bound', (overrides) => {
    expect(refusedSettingOf(overrides)).toBeNull();
  });

  it.each([
    [{ platformFeePercent: -0.01 }, 'platformFeePercent'],
    [{ platformFeePercent: 50.01 }, 'platformFeePercent'],
    [{ platformFeePercent: 12.345 }, 'platformFeePercent'],
    [{ freeCancellationHours: 337 }, 'freeCancellationHours'],
    [{ freeCancellationHours: 1.5 }, 'freeCancellationHours'],
    [{ requestExpiryHours: 0 }, 'requestExpiryHours'],
    [{ requestExpiryHours: 97 }, 'requestExpiryHours'],
    [{ payoutReleaseDelayHours: -1 }, 'payoutReleaseDelayHours'],
    [{ payoutReleaseDelayHours: 721 }, 'payoutReleaseDelayHours'],
    [{ payoutReleaseDelayHours: Number.NaN }, 'payoutReleaseDelayHours'],
  ])('refuses %o and names %s', (overrides, setting) => {
    expect(refusedSettingOf(overrides)).toBe(setting);
  });
});
