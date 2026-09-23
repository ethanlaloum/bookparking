import { cn } from '../../lib/cn';

/** Le panneau « stationnement interdit » : disque bleu, couronne et barre rouges. */
export const NoParkingSign = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 120" aria-hidden="true" className={cn('size-40', className)}>
    <circle cx="60" cy="60" r="56" fill="#ffffff" />
    <circle cx="60" cy="60" r="50" fill="#1f46e0" stroke="#d62828" strokeWidth="11" />
    <path d="M28 28L92 92" stroke="#d62828" strokeWidth="11" strokeLinecap="butt" />
  </svg>
);
