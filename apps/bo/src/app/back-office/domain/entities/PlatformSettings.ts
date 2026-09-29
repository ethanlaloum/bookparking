import type { components } from '@front/api/schema';

export type PlatformSettings = components['schemas']['PlatformSettings'];
export type PlatformSettingsForm = components['schemas']['PlatformSettingsForm'];
export type SettingBounds = components['schemas']['SettingBounds'];
export type PlatformSetting = keyof PlatformSettings;

// L'ordre de l'écran, du formulaire comme du journal.
export const PLATFORM_SETTINGS: readonly PlatformSetting[] = [
  'platformFeePercent',
  'freeCancellationHours',
  'requestExpiryHours',
  'payoutReleaseDelayHours',
];

/**
 * Report du contrôle de l'api (`checkPlatformSettings`), avec les bornes
 * qu'elle rend : le formulaire refuse ce qu'elle refuserait, sans en recopier
 * un seul chiffre. C'est l'api qui tranche, et son refus en 400 s'affiche tel
 * quel.
 */
export const isWithinBounds = (value: number, bounds: SettingBounds): boolean => {
  if (!Number.isFinite(value) || value < bounds.min || value > bounds.max) return false;
  const scaled = value * 10 ** bounds.decimals;
  return Math.abs(Math.round(scaled) - scaled) < 1e-9;
};

export const changedSettings = (
  before: PlatformSettings,
  after: PlatformSettings,
): PlatformSetting[] => PLATFORM_SETTINGS.filter((setting) => before[setting] !== after[setting]);
