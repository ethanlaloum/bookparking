import { z } from 'zod';

import { isAcceptableEmail } from '../app/account/domain/entities/Account';
import { i18n } from '../lib/i18n';

export const forgotPasswordSchema = z.object({
  email: z.string().refine(isAcceptableEmail, { message: i18n.t('auth:validation.email') }),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
