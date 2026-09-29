import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

import { cn } from '../lib/cn';

interface NoticeProps {
  tone: 'error' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const TONE = {
  error: { icon: AlertTriangle, box: 'border-danger/35 bg-danger-bg text-danger' },
  success: { icon: CheckCircle2, box: 'border-ok/35 bg-ok-bg text-ok' },
  info: { icon: Info, box: 'border-line-strong bg-bg-sunken text-fg-muted' },
} as const;

/**
 * `role="alert"` et `tabIndex={-1}` sur le conteneur d'erreur : apres un envoi
 * refuse, l'ecran y deplace le focus, sinon un utilisateur au clavier reste au
 * bas du formulaire sans jamais apprendre pourquoi rien ne s'est passe.
 */
export const Notice = ({ tone, title, children, className }: NoticeProps) => {
  const { icon: Icon, box } = TONE[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      tabIndex={tone === 'error' ? -1 : undefined}
      className={cn('flex items-start gap-2.5 rounded-[2px] border px-3.5 py-3 text-sm', box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title !== undefined && <p className="font-semibold">{title}</p>}
        <div className={cn(title !== undefined && 'mt-0.5', 'text-current/90')}>{children}</div>
      </div>
    </div>
  );
};
