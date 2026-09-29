import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium cursor-pointer select-none whitespace-nowrap rounded-[2px] transition-[background-color,color,border-color,box-shadow] duration-200 ease-[var(--ease-signal)] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:bg-accent-hover',
        outline: 'border border-line-strong bg-bg-raised text-fg hover:border-accent hover:text-accent',
        ghost: 'text-fg-muted hover:bg-bg-sunken hover:text-fg',
        danger: 'border border-danger/40 bg-danger-bg text-danger hover:border-danger',
      },
      size: {
        md: 'min-h-11 px-5 text-sm',
        lg: 'min-h-13 px-7 text-base',
        sm: 'min-h-9 px-3 text-sm',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
