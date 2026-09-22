import { z } from 'zod';

import { VEHICLE_TYPES } from '../app/listing/domain/entities/SearchCriteria';
import { i18n } from '../lib/i18n';

const price = z
  .string()
  .trim()
  .refine((value) => value === '' || Number.isFinite(Number(value.replace(',', '.'))), {
    message: i18n.t('listing:pricing.integer'),
  });

export const publishListingSchema = z
  .object({
    address: z.string().trim().min(1, { message: i18n.t('listing:validation.address') }),
    box: z.string().trim().min(1, { message: i18n.t('listing:validation.box') }),
    accessDescription: z.string().trim().min(1, { message: i18n.t('listing:validation.access') }),
    photos: z.string().trim().min(1, { message: i18n.t('listing:validation.photos') }),
    acceptedVehicles: z
      .array(z.enum(VEHICLE_TYPES))
      .min(1, { message: i18n.t('listing:criteria.acceptedRequired') }),
    dayInCents: price,
    weekInCents: price,
    monthInCents: price,
    from: z.string().min(1, { message: i18n.t('listing:validation.from') }),
    to: z.string().min(1, { message: i18n.t('listing:validation.to') }),
  })
  .refine((values) => values.dayInCents !== '' || values.weekInCents !== '' || values.monthInCents !== '', {
    message: i18n.t('listing:validation.pricing'),
    path: ['dayInCents'],
  })
  .refine((values) => values.to >= values.from, {
    message: i18n.t('listing:validation.reversed'),
    path: ['to'],
  });

export type PublishListingValues = z.infer<typeof publishListingSchema>;
