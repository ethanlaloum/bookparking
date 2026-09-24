import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const subscribe = (onChange: () => void): (() => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

/**
 * Les animations SMIL d'un SVG échappent à la règle CSS globale sur
 * `prefers-reduced-motion` : elles ne passent par aucune propriété
 * `animation-*`. Le composant qui en porte doit donc le demander lui-même, et
 * rendre son état final plutôt que de le jouer.
 */
export const usePrefersReducedMotion = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
