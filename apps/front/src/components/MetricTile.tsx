import type { LucideIcon } from 'lucide-react';

import { cn } from '../lib/cn';

interface MetricTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}

export const MetricTile = ({ icon: Icon, label, value, hint, accent = false }: MetricTileProps) => (
  // `role="group"` + `aria-label` : sans eux, la tuile n'a pas de nom
  // accessible, et ni un lecteur d'ecran ni un test ne peuvent rapprocher la
  // valeur de ce qu'elle mesure — les deux ne sont que deux paragraphes voisins.
  <div
    role="group"
    aria-label={label}
    className={cn(
      'flex flex-col gap-1.5 rounded-[2px] border p-5',
      accent ? 'border-accent/40 bg-accent/5' : 'border-line bg-bg-raised',
    )}
  >
    <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">
      <Icon className={cn('size-4', accent ? 'text-accent' : 'text-fg-subtle')} aria-hidden="true" />
      {label}
    </p>
    <p
      className={cn(
        'tabular font-display text-3xl leading-none font-bold',
        accent ? 'text-accent' : 'text-fg',
      )}
    >
      {value}
    </p>
    <p className="text-xs leading-snug text-fg-subtle">{hint}</p>
  </div>
);
