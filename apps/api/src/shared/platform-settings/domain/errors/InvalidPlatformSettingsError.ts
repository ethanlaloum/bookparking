import type { PlatformSetting } from '../entities/PlatformSettings';

const MESSAGE_BY_SETTING: Record<
  PlatformSetting,
  (bounds: { min: number; max: number }) => string
> = {
  platformFeePercent: ({ min, max }) =>
    `La commission doit être comprise entre ${min} et ${max} %, au centième près`,
  freeCancellationHours: ({ min, max }) =>
    `Le délai d’annulation gratuite doit être un nombre entier d’heures, entre ${min} et ${max}`,
  requestExpiryHours: ({ min, max }) =>
    `Le délai de réponse du loueur doit être un nombre entier d’heures, entre ${min} et ${max}`,
  payoutReleaseDelayHours: ({ min, max }) =>
    `Le délai de libération de l’argent doit être un nombre entier d’heures, entre ${min} et ${max}`,
};

export class InvalidPlatformSettingsError extends Error {
  protected readonly _tag = 'InvalidPlatformSettingsError';
  public readonly setting: PlatformSetting;

  constructor(setting: PlatformSetting, bounds: { min: number; max: number }) {
    super(MESSAGE_BY_SETTING[setting](bounds));
    this.setting = setting;
  }
}
