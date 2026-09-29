import { cn } from '../../lib/cn';

export const Spinner = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
      className,
    )}
  />
);
