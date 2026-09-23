import { cva, type VariantProps } from 'class-variance-authority';

// `translate` et `scale` sont des propriétés CSS à part entière en Tailwind 4 :
// elles doivent figurer dans la liste de transition, sinon le soulèvement au
// survol et l'enfoncement au clic arrivent sans courbe.
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium cursor-pointer select-none whitespace-nowrap rounded-xl transition-[background-color,color,border-color,box-shadow,translate,scale] duration-200 ease-[var(--ease-signal)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-on-brand shadow-[var(--shadow-brand)] hover:-translate-y-px hover:bg-brand-hover',
        outline:
          'border border-line-strong bg-bg-raised text-fg hover:border-fg-subtle hover:bg-bg-sunken',
        ghost: 'text-fg-muted hover:bg-bg-sunken hover:text-fg',
        danger: 'border border-danger/40 bg-danger-bg text-danger hover:border-danger',
        // Sur l'encre ou sur le bleu : le blanc est le seul fond qui ne se
        // confond avec aucun des deux.
        inverse:
          'bg-white text-asphalt-950 shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)] hover:-translate-y-px hover:bg-asphalt-100',
        glass: 'border border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10',
      },
      size: {
        sm: 'min-h-9 rounded-lg px-3.5 text-sm',
        md: 'min-h-11 px-5 text-sm',
        lg: 'min-h-13 px-7 text-base font-semibold',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
