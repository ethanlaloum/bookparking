import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-bg-sunken text-fg-muted ring-1 ring-line ring-inset',
        accent: 'bg-brand text-on-brand',
        ok: 'bg-ok-bg text-ok ring-1 ring-ok/20 ring-inset',
        warn: 'bg-warn-bg text-warn ring-1 ring-warn/25 ring-inset',
        danger: 'bg-danger-bg text-danger ring-1 ring-danger/20 ring-inset',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
