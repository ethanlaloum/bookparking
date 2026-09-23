import { useEffect, type ReactNode } from 'react';

import { Notice } from '../Notice';

/**
 * Le gabarit des pages légales. Leur texte est en français seulement, hors
 * i18n : c'est le droit français qui les impose et c'est en français qu'elles
 * font foi. Tant qu'un passage reste « À compléter », la page le dit en tête :
 * une page légale incomplète ne doit jamais passer pour une page terminée.
 */
export const LegalPage = ({
  title,
  updatedOn,
  draft,
  children,
}: {
  title: string;
  updatedOn: string;
  draft: boolean;
  children: ReactNode;
}) => {
  // On arrive ici depuis le pied de page : sans cela, le routeur garderait le
  // défilement et la page s'ouvrirait sur sa fin. `instant`, parce que
  // `index.css` pose `scroll-behavior: smooth` sur `html` : un changement de
  // page n'est pas une ancre qu'on rejoint en glissant.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="label-ticket text-fg-subtle">Informations légales</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight font-bold tracking-tight text-fg">
        {title}
      </h1>
      <p className="mt-2 text-sm text-fg-subtle">Dernière mise à jour : {updatedOn}</p>
      {draft && (
        <Notice tone="info" title="Document de travail" className="mt-6">
          Les passages marqués « À compléter » doivent être renseignés, et l’ensemble relu par un
          juriste, avant la mise en ligne du site.
        </Notice>
      )}
      <div className="mt-4">{children}</div>
    </article>
  );
};

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-10">
    <h2 className="font-display text-xl font-bold tracking-tight text-fg">{title}</h2>
    <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-fg-muted">{children}</div>
  </section>
);

export const LegalList = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc space-y-1.5 pl-5 marker:text-fg-subtle">{children}</ul>
);

/** Un fait que le code ne connaît pas et qu'il ne faut jamais inventer. */
export const ToComplete = ({ children }: { children: ReactNode }) => (
  <mark className="rounded bg-warn-bg px-1 font-medium text-warn">[À compléter : {children}]</mark>
);

export const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="font-medium text-accent underline underline-offset-4"
  >
    {children}
  </a>
);
