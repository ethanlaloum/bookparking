import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, body, action }: EmptyStateProps) => (
  <div className="bg-hatch flex flex-col items-center gap-3 border border-dashed border-line-strong px-6 py-16 text-center">
    <p className="font-display text-lg font-semibold text-fg">{title}</p>
    {body !== undefined && <p className="max-w-sm text-sm text-fg-muted">{body}</p>}
    {action}
  </div>
);
