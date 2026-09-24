import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-2xl border border-line bg-bg-raised shadow-[var(--shadow-panel)]',
      className,
    )}
    {...props}
  />
);
