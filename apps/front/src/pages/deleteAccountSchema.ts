import { z } from 'zod';

import { i18n } from '../lib/i18n';

export const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: i18n.t('account:validation.deletePassword') }),
});

export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
