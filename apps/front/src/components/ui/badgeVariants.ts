import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-bg-sunken text-fg-muted',
        accent: 'bg-accent text-on-accent',
        ok: 'bg-ok-bg text-ok',
        warn: 'bg-warn-bg text-warn',
        danger: 'bg-danger-bg text-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
