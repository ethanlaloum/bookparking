import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Un interrupteur au motif ARIA « switch » : un `<button role="switch">` dont
 * `aria-checked` dit l'état. Le nom vient de l'appelant, par `aria-labelledby`.
 */
export const Switch = ({ checked, onCheckedChange, className, ...props }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-[var(--ease-signal)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60',
      checked ? 'border-transparent bg-brand' : 'border-line-strong bg-bg-sunken',
      className,
    )}
    {...props}
  >
    <span
      aria-hidden="true"
      className={cn(
        'size-5 rounded-full shadow-[0_2px_6px_-1px_rgb(11_13_18/0.35)] transition-[translate,background-color] duration-200 ease-[var(--ease-signal)]',
        checked ? 'translate-x-[1.375rem] bg-white' : 'translate-x-[0.1875rem] bg-fg-subtle',
      )}
    />
  </button>
);
