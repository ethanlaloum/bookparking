import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

const shared =
  'w-full rounded-[2px] border bg-bg-raised px-3 text-fg placeholder:text-fg-subtle transition-colors duration-150 focus:border-accent aria-[invalid=true]:border-danger';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(shared, 'min-h-11 border-line-strong', className)} {...props} />
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(shared, 'min-h-24 border-line-strong py-2.5', className)} {...props} />
);
