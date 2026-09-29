import { z } from 'zod';

import {
  isWithinBounds,
  type PlatformSettingsForm,
  type SettingBounds,
} from '../app/back-office/domain/entities/PlatformSettings';
import { i18n } from '../lib/i18n';
import { MINIMUM_REASON_LENGTH } from './moderationSchema';

const withinBounds = (bounds: SettingBounds) =>
  z.number().refine((value) => isWithinBounds(value, bounds), {
    message: i18n.t(
      bounds.decimals === 0 ? 'admin:settings.validation.integer' : 'admin:settings.validation.decimal',
      { min: bounds.min, max: bounds.max },
    ),
  });

// Construit depuis les bornes que l'api rend : le formulaire n'en recopie
// aucune, et un seuil déplacé côté api se voit ici sans toucher au code.
export const settingsSchemaFor = ({ bounds }: PlatformSettingsForm) =>
  z.object({
    platformFeePercent: withinBounds(bounds.platformFeePercent),
    freeCancellationHours: withinBounds(bounds.freeCancellationHours),
    requestExpiryHours: withinBounds(bounds.requestExpiryHours),
    payoutReleaseDelayHours: withinBounds(bounds.payoutReleaseDelayHours),
    reason: z.string().refine((value) => value.trim().length >= MINIMUM_REASON_LENGTH, {
      message: i18n.t('admin:settings.validation.reason'),
    }),
  });

export type SettingsValues = z.infer<ReturnType<typeof settingsSchemaFor>>;
