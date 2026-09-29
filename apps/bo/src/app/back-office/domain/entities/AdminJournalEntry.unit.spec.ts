import { describe, expect, it } from 'vitest';

import { aJournalEntry } from '../../../../store/testing/InMemoryDependencies';
import { matchesFilter, settingChangesOf } from './AdminJournalEntry';

const BEFORE = {
  platformFeePercent: 15,
  freeCancellationHours: 24,
  requestExpiryHours: 48,
  payoutReleaseDelayHours: 24,
};

const aSettingsChange = (before: typeof BEFORE | null) =>
  aJournalEntry({
    kind: 'CHANGE_PLATFORM_SETTINGS',
    targetType: 'PLATFORM_SETTINGS',
    targetLabel: null,
    settingsChange: { before, after: { ...BEFORE, requestExpiryHours: 24 } },
  });

describe('settingChangesOf', () => {
  it('keeps only what the change moved, with both values', () => {
    expect(settingChangesOf(aSettingsChange(BEFORE))).toEqual([
      { setting: 'requestExpiryHours', from: 48, to: 24 },
    ]);
  });

  it('lists every value of a first version, which replaced nothing', () => {
    expect(settingChangesOf(aSettingsChange(null))).toEqual([
      { setting: 'platformFeePercent', from: null, to: 15 },
      { setting: 'freeCancellationHours', from: null, to: 24 },
      { setting: 'requestExpiryHours', from: null, to: 24 },
      { setting: 'payoutReleaseDelayHours', from: null, to: 24 },
    ]);
  });

  it('says nothing for a moderation', () => {
    expect(settingChangesOf(aJournalEntry())).toEqual([]);
  });
});

describe('matchesFilter', () => {
  it.each([
    ['all', 'SUSPEND_ACCOUNT', true],
    ['all', 'CHANGE_PLATFORM_SETTINGS', true],
    ['moderation', 'CANCEL_RENTAL_REQUEST', true],
    ['moderation', 'CHANGE_PLATFORM_SETTINGS', false],
    ['settings', 'CHANGE_PLATFORM_SETTINGS', true],
    ['settings', 'UNPUBLISH_LISTING', false],
  ] as const)('the %s filter keeps %s: %s', (filter, kind, expected) => {
    expect(matchesFilter(aJournalEntry({ kind }), filter)).toBe(expected);
  });
});
