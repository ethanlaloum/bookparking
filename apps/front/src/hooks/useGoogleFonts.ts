import { useEffect } from 'react';

const STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&display=swap';

const createLink = (attributes: Partial<HTMLLinkElement>): HTMLLinkElement =>
  Object.assign(document.createElement('link'), attributes);

/**
 * Les polices ne partent plus d'`index.html` : Google reçoit l'adresse IP de
 * quiconque les charge, et la page ne peut pas savoir, avant d'avoir lu le
 * consentement, si le visiteur l'a permis. Sans accord, les piles de
 * `index.css` retombent sur les polices de l'appareil.
 *
 * Retirer la feuille au retrait de l'accord rend aussitôt les polices système :
 * rien de Google n'est plus demandé pour le reste de la visite.
 */
export const useGoogleFonts = (enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) return;
    const links = [
      createLink({ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }),
      createLink({ rel: 'stylesheet', href: STYLESHEET }),
    ];
    for (const link of links) document.head.appendChild(link);
    return () => {
      for (const link of links) link.remove();
    };
  }, [enabled]);
};
