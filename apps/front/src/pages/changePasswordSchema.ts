import { z } from 'zod';

import { isAcceptablePassword } from '../app/account/domain/entities/Account';
import { i18n } from '../lib/i18n';

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: i18n.t('account:validation.current') }),
  newPassword: z
    .string()
    .refine(isAcceptablePassword, { message: i18n.t('account:validation.next') }),
});

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
