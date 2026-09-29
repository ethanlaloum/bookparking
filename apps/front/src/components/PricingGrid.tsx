import { useTranslation } from 'react-i18next';

import type { Pricing } from '../app/listing/domain/entities/Listing';
import { cn } from '../lib/cn';
import { formatCents } from '../lib/format';

const TIERS = ['day', 'week', 'month'] as const;

const READ: Record<(typeof TIERS)[number], (pricing: Pricing) => number | null> = {
  day: (pricing) => pricing.dayInCents,
  week: (pricing) => pricing.weekInCents,
  month: (pricing) => pricing.monthInCents,
};

export const PricingGrid = ({ pricing }: { pricing: Pricing }) => {
  const { t } = useTranslation('listing');

  return (
    <dl className="grid grid-cols-3 gap-3">
      {TIERS.map((tier) => {
        const value = READ[tier](pricing);
        return (
          <div
            key={tier}
            className={cn(
              'rounded-2xl border px-4 py-4',
              value === null ? 'bg-hatch border-dashed border-line-strong' : 'border-line bg-bg-raised',
            )}
          >
            <dt className="label-ticket text-fg-subtle">{t(`pricing.${tier}`)}</dt>
            <dd
              className={cn(
                'tabular mt-2 font-display text-2xl font-bold tracking-tight',
                value === null ? 'text-fg-subtle' : 'text-fg',
              )}
            >
              {value === null ? t('pricing.none') : formatCents(value)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};
