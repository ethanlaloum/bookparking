import { useTranslation } from 'react-i18next';

import type { Pricing } from '../app/listing/domain/entities/Listing';
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
    <dl className="grid grid-cols-3 border border-line">
      {TIERS.map((tier, index) => {
        const value = READ[tier](pricing);
        return (
          <div
            key={tier}
            className={`px-4 py-3.5 ${index > 0 ? 'border-l border-line' : ''} ${
              value === null ? 'bg-bg-sunken' : ''
            }`}
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
              {t(`pricing.${tier}`)}
            </dt>
            <dd
              className={`tabular mt-1 font-display text-lg font-semibold ${
                value === null ? 'text-fg-subtle' : 'text-fg'
              }`}
            >
              {value === null ? t('pricing.none') : formatCents(value)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};
