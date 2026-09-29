import type { components } from '@front/api/schema';

import { PLATFORM_SETTINGS, type PlatformSetting } from './PlatformSettings';

export type AdminJournalEntry = components['schemas']['AdminJournalEntry'];
export type AdminActionKind = AdminJournalEntry['kind'];

export type JournalFilter = 'all' | 'moderation' | 'settings';

export const matchesFilter = (entry: AdminJournalEntry, filter: JournalFilter): boolean => {
  if (filter === 'all') return true;
  const isSettings = entry.kind === 'CHANGE_PLATFORM_SETTINGS';
  return filter === 'settings' ? isSettings : !isSettings;
};

export interface SettingChange {
  setting: PlatformSetting;
  // `null` pour la toute première version, qui ne remplaçait rien.
  from: number | null;
  to: number;
}

/**
 * Ce qu'un changement de réglages a vraiment modifié : les réglages restés
 * identiques n'encombrent pas la ligne du journal.
 */
export const settingChangesOf = (entry: AdminJournalEntry): SettingChange[] => {
  const change = entry.settingsChange;
  if (change === null) return [];
  return PLATFORM_SETTINGS.filter(
    (setting) => change.before === null || change.before[setting] !== change.after[setting],
  ).map((setting) => ({
    setting,
    from: change.before === null ? null : change.before[setting],
    to: change.after[setting],
  }));
};
