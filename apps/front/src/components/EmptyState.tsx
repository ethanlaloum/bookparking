import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: ReactNode;
}

/**
 * Une place vide, dessinée comme au sol : deux lignes blanches, rien entre
 * elles. C'est le même motif que la vignette d'une annonce, en creux.
 */
const EmptyBay = () => (
  <svg viewBox="0 0 96 72" aria-hidden="true" className="h-16 w-auto text-fg-subtle">
    <path d="M14 6v60M82 6v60M14 6h68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.45" fill="none" />
    <path d="M30 60h36" stroke="currentColor" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" opacity="0.3" />
    <rect x="36" y="20" width="24" height="24" rx="6" fill="#1f46e0" opacity="0.9" />
    <path d="M44.5 38V26h4.6c2.4 0 4 1.4 4 3.7s-1.6 3.8-4 3.8h-1.8V38h-2.8zm2.8-6.5h1.5c1.1 0 1.8-.6 1.8-1.7s-.7-1.6-1.8-1.6h-1.5v3.3z" fill="#fff" />
  </svg>
);

export const EmptyState = ({ title, body, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-bg-raised/60 px-6 py-14 text-center">
    <EmptyBay />
    <p className="mt-2 font-display text-lg font-semibold text-fg">{title}</p>
    {body !== undefined && <p className="max-w-sm text-sm text-fg-muted">{body}</p>}
    {action !== undefined && <div className="mt-2">{action}</div>}
  </div>
);
