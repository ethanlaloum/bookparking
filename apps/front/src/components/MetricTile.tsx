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
  plain: {
    box: 'border-line bg-bg-raised',
    chip: 'bg-bg-sunken text-fg-muted',
    label: 'text-fg-muted',
    value: 'text-fg',
    hint: 'text-fg-subtle',
  },
  // La tuile d'accent est pleine : c'est le chiffre qu'on vient lire. Le bleu
  // du panneau, fixe dans les deux thèmes — le bleu plus clair du thème sombre
  // ne porterait pas un texte blanc atténué à 4,5:1.
  accent: {
    box: 'grain border-transparent bg-signal-600 text-white shadow-[var(--shadow-brand)]',
    chip: 'bg-white/15 text-white',
    label: 'text-white/85',
    value: 'text-white',
    hint: 'text-white/85',
  },
  warn: {
    box: 'border-warn/35 bg-warn-bg',
    chip: 'bg-warn/15 text-warn',
    label: 'text-warn',
    value: 'text-warn',
    hint: 'text-fg-muted',
  },
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
      {/* L'en-tête a la hauteur de la pastille d'icône, qu'il tienne sur une
          ligne ou deux : les montants de tuiles voisines tombent ainsi sur la
          même ligne, et l'aide, de longueur variable, part en bas. */}
      <div className="flex min-h-9 items-start justify-between gap-3">
        <p className={cn('label-ticket leading-snug', style.label)}>{label}</p>
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', style.chip)}>
          <Icon className="size-[1.1rem]" aria-hidden="true" />
        </span>
      </div>
      <p
        className={cn(
          'tabular mt-2 font-display text-[2.5rem] leading-none font-bold tracking-[-0.04em]',
          style.value,
        )}
      >
        {value}
      </p>
      <p className={cn('mt-auto text-xs leading-snug', style.hint)}>{hint}</p>
    </>
  );

  const shell = 'relative flex min-h-44 flex-col gap-3 overflow-hidden rounded-2xl border p-5';

  // Une tuile cliquable est un lien, pas une `div` avec un `onClick` : elle se
  // parcourt au clavier, s'ouvre dans un onglet, et porte déjà un rôle.
  if (to !== undefined)
    return (
      <Link
        to={to}
        aria-label={label}
        className={cn(
          shell,
          style.box,
          'transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]',
        )}
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
