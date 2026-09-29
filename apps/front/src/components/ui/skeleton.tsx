import { cn } from '../../lib/cn';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-shimmer rounded-2xl bg-bg-sunken', className)} />
);
