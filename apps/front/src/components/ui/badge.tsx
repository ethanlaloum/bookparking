import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';
import { badgeVariants, type BadgeVariantProps } from './badgeVariants';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & BadgeVariantProps;

export const Badge = ({ className, tone, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ tone }), className)} {...props} />
);
