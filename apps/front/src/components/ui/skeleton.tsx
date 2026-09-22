import { cn } from '../../lib/cn';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-[2px] bg-bg-sunken', className)} />
);
