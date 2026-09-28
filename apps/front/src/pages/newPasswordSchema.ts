import { z } from 'zod';

import { passwordStrengthOf, passwordsMatch } from '../app/account/domain/entities/Password';
import { i18n } from '../lib/i18n';

export const newPasswordSchema = z
  .object({
    password: z.string().superRefine((password, context) => {
      const strength = passwordStrengthOf(password);
      if (strength === 'TOO_SHORT')
        context.addIssue({ code: 'custom', message: i18n.t('auth:validation.password') });
      if (strength === 'WEAK')
        context.addIssue({ code: 'custom', message: i18n.t('auth:validation.passwordWeak') });
    }),
    confirmPassword: z.string(),
  })
  .refine((values) => passwordsMatch(values.password, values.confirmPassword), {
    path: ['confirmPassword'],
    message: i18n.t('auth:validation.passwordMismatch'),
  });

export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
