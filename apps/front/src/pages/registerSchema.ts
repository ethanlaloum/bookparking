import { z } from 'zod';

import { isAcceptableEmail } from '../app/account/domain/entities/Account';
import { passwordStrengthOf, passwordsMatch } from '../app/account/domain/entities/Password';
import { i18n } from '../lib/i18n';

// SPEC-007 : la jauge est bloquante — un mot de passe trop court ou faible ne
// part pas — et la confirmation doit être identique.
export const registerSchema = z
  .object({
    email: z.string().refine(isAcceptableEmail, { message: i18n.t('auth:validation.email') }),
    password: z.string().superRefine((password, context) => {
      const strength = passwordStrengthOf(password);
      if (strength === 'TOO_SHORT')
        context.addIssue({ code: 'custom', message: i18n.t('auth:validation.password') });
      if (strength === 'WEAK')
        context.addIssue({ code: 'custom', message: i18n.t('auth:validation.passwordWeak') });
    }),
    confirmPassword: z.string(),
    // SPEC-008 : la case des conditions d'utilisation doit être cochée.
    acceptsTerms: z.boolean().refine((accepted) => accepted, {
      message: i18n.t('auth:validation.terms'),
    }),
  })
  .refine((values) => passwordsMatch(values.password, values.confirmPassword), {
    path: ['confirmPassword'],
    message: i18n.t('auth:validation.passwordMismatch'),
  });

export type RegisterValues = z.infer<typeof registerSchema>;
