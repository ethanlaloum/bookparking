import { cn } from '../lib/cn';

/**
 * Le panneau de stationnement europeen : carre bleu, P blanc. C'est la marque,
 * et c'est aussi le seul endroit ou le bleu est impose plutot que derive des
 * tokens — un panneau qui change de couleur n'est plus un panneau.
 */
export const ParkingMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" role="img" aria-hidden="true" className={cn('size-8', className)}>
    <rect width="32" height="32" rx="7" fill="#1f46e0" />
    <path
      d="M11 24V8h6.4c3.5 0 5.6 2 5.6 5.1s-2.1 5.2-5.6 5.2h-2.6V24H11zm3.8-8.6h2.2c1.6 0 2.6-.9 2.6-2.3s-1-2.2-2.6-2.2h-2.2v4.5z"
      fill="#ffffff"
    />
  </svg>
);
