import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

import { cn } from '../lib/cn';

interface NoticeProps {
  tone: 'error' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const TONE = {
  error: {
    icon: AlertTriangle,
    box: 'border-danger/30 bg-danger-bg text-danger',
    chip: 'bg-danger/12',
  },
  success: { icon: CheckCircle2, box: 'border-ok/30 bg-ok-bg text-ok', chip: 'bg-ok/12' },
  info: {
    icon: Info,
    box: 'border-line bg-bg-raised text-fg-muted',
    chip: 'bg-accent-soft text-accent',
  },
} as const;

/**
 * `role="alert"` et `tabIndex={-1}` sur le conteneur d'erreur : apres un envoi
 * refuse, l'ecran y deplace le focus, sinon un utilisateur au clavier reste au
 * bas du formulaire sans jamais apprendre pourquoi rien ne s'est passe.
 */
export const Notice = ({ tone, title, children, className }: NoticeProps) => {
  const { icon: Icon, box, chip } = TONE[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      tabIndex={tone === 'error' ? -1 : undefined}
      className={cn(
        'animate-fade flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm',
        box,
        className,
      )}
    >
      <span className={cn('grid size-6 shrink-0 place-items-center rounded-lg', chip)}>
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        {title !== undefined && <p className="font-semibold">{title}</p>}
        <div className={cn(title !== undefined && 'mt-0.5', 'text-current/90')}>{children}</div>
      </div>
    </div>
  );
};
