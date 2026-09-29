import type { ReactNode } from 'react';

interface TableShellProps {
  caption: string;
  head: ReactNode;
  children: ReactNode;
}

/**
 * Le seul élément de l'application autorisé à déborder horizontalement, et il
 * le fait dans son propre conteneur : une console de modération porte sept
 * colonnes, et un tableau qui pousse la page entière casserait la navigation
 * sur un portable. La légende est lue par les lecteurs d'écran et cachée à
 * l'œil — un tableau sans nom est une grille d'inconnues.
 */
export const TableShell = ({ caption, head, children }: TableShellProps) => (
  <div className="overflow-x-auto rounded-2xl border border-line bg-bg-raised shadow-[var(--shadow-panel)]">
    <table className="w-full min-w-[54rem] border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="border-b border-line bg-bg-sunken/60">
        <tr className="label-ticket text-left text-fg-subtle">{head}</tr>
      </thead>
      <tbody className="[&>tr]:transition-colors [&>tr:hover]:bg-bg-sunken/50">{children}</tbody>
    </table>
  </div>
);

// `px-3` et non `px-4` : mesuré à l'écran, la table des demandes — huit
// colonnes — atteint 1360 px de large pour 1338 px de conteneur, et son dernier
// en-tête « Action » sortait du cadre tant qu'on n'avait pas fait défiler.
// Huit pixels de moins par côté et par colonne rendent les 64 px qui manquaient.
export const Th = ({ children, className }: { children: ReactNode; className?: string }) => (
  <th scope="col" className={`px-3 py-3.5 font-medium ${className ?? ''}`}>
    {children}
  </th>
);

export const Td = ({ children, className }: { children: ReactNode; className?: string }) => (
  <td className={`px-3 py-3.5 align-middle ${className ?? ''}`}>{children}</td>
);
