import { z } from 'zod';

import { i18n } from '../lib/i18n';

const price = z
  .string()
  .trim()
  .refine((value) => value === '' || Number.isFinite(Number(value.replace(',', '.'))), {
    message: i18n.t('listing:pricing.integer'),
  });

export const pricingSchema = z
  .object({ dayInCents: price, weekInCents: price, monthInCents: price })
  .refine((values) => values.dayInCents !== '' || values.weekInCents !== '' || values.monthInCents !== '', {
    message: i18n.t('listing:pricing.atLeastOne'),
    path: ['dayInCents'],
  });

export type PricingValues = z.infer<typeof pricingSchema>;
