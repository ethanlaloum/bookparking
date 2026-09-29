import { z } from 'zod';

import { i18n } from '../lib/i18n';

/**
 * Report du `MINIMUM_REASON_LENGTH` de l'api (`AdminAction.ts`). Le contrôle
 * local épargne un aller-retour sur la faute la plus courante — un motif écrit
 * en trois mots — mais c'est `ModerationSchema` côté api qui tranche, et son
 * refus en 400 s'affiche tel quel dans la modale.
 */
export const MINIMUM_REASON_LENGTH = 10;

export const moderationSchema = z.object({
  reason: z.string().refine((value) => value.trim().length >= MINIMUM_REASON_LENGTH, {
    message: i18n.t('admin:moderation.validation.reason'),
  }),
});

export type ModerationValues = z.infer<typeof moderationSchema>;
