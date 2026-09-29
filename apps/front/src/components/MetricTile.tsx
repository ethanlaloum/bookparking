import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '../lib/cn';

interface MetricTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: 'plain' | 'accent' | 'warn';
  to?: string;
}

const TONE = {
  plain: { box: 'border-line bg-bg-raised', icon: 'text-fg-subtle', value: 'text-fg' },
  accent: { box: 'border-accent/40 bg-accent/5', icon: 'text-accent', value: 'text-accent' },
  warn: { box: 'border-warn/45 bg-warn-bg', icon: 'text-warn', value: 'text-warn' },
} as const;

/**
 * `role="group"` + `aria-label` : sans eux, la tuile n'a pas de nom
 * accessible, et ni un lecteur d'écran ni un test ne peuvent rapprocher la
 * valeur de ce qu'elle mesure — les deux ne sont que deux paragraphes voisins.
 */
export const MetricTile = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'plain',
  to,
}: MetricTileProps) => {
  const style = TONE[tone];

  const body = (
    <>
      <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">
        <Icon className={cn('size-4', style.icon)} aria-hidden="true" />
        {label}
      </p>
      <p className={cn('tabular font-display text-3xl leading-none font-bold', style.value)}>
        {value}
      </p>
      <p className="text-xs leading-snug text-fg-subtle">{hint}</p>
    </>
  );

  const shell = 'flex flex-col gap-1.5 rounded-[2px] border p-5';

  // Une tuile cliquable est un lien, pas une `div` avec un `onClick` : elle se
  // parcourt au clavier, s'ouvre dans un onglet, et porte déjà un rôle.
  if (to !== undefined)
    return (
      <Link
        to={to}
        aria-label={label}
        className={cn(shell, style.box, 'transition-colors hover:border-accent')}
      >
        {body}
      </Link>
    );

  return (
    <div role="group" aria-label={label} className={cn(shell, style.box)}>
      {body}
    </div>
  );
};
