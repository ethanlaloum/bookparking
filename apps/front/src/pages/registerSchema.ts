import { z } from 'zod';

import { isAcceptableEmail, isAcceptablePassword } from '../app/account/domain/entities/Account';
import { i18n } from '../lib/i18n';

export const registerSchema = z.object({
  email: z.string().refine(isAcceptableEmail, { message: i18n.t('auth:validation.email') }),
  password: z
    .string()
    .refine(isAcceptablePassword, { message: i18n.t('auth:validation.password') }),
});

export type RegisterValues = z.infer<typeof registerSchema>;
