import { useEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom';

/**
 * `BrowserRouter` garde le défilement d'une page à l'autre : un lien du pied de
 * page ouvrait la page suivante sur sa fin. On remonte donc en haut à chaque
 * changement de chemin — sauf sur précédent/suivant (`POP`), où le navigateur
 * restitue lui-même la position quittée.
 *
 * Seul le chemin compte : `/recherche` réécrit ses paramètres à chaque critère
 * sans quitter la page, et ce changement-là fait passer le type de navigation
 * de `POP` à `PUSH`. D'où la comparaison au dernier chemin, et non au seul type.
 * `instant`, enfin, parce que `index.css` pose `scroll-behavior: smooth` sur
 * `html` : un changement de page n'est pas une ancre qu'on rejoint en glissant.
 */
export const useScrollToTopOnNavigation = (): void => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (navigationType !== NavigationType.Pop) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, navigationType]);
};
