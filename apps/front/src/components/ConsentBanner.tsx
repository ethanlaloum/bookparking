import { Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/button';

interface ConsentBannerProps {
  onAcceptAll: () => void;
  onRefuseAll: () => void;
  onCustomize: () => void;
}

/**
 * Muet, comme la modale de modération : il rend un geste, et c'est
 * `ConsentManager` qui sait quoi en faire.
 *
 * « Tout refuser » et « Tout accepter » portent la même variante, côte à côte :
 * refuser doit être aussi simple qu'accepter, et ni la couleur ni l'ordre ne
 * doivent pousser l'un plutôt que l'autre. Le bandeau est `sticky` en fin de
 * page plutôt que `fixed` : arrivé tout en bas, il se range après le pied de
 * page au lieu d'en masquer la dernière ligne.
 */
export const ConsentBanner = ({ onAcceptAll, onRefuseAll, onCustomize }: ConsentBannerProps) => {
  const { t } = useTranslation('consent');

  return (
    <section
      aria-labelledby="titre-bandeau-consentement"
      className="animate-rise sticky bottom-0 z-40 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
    >
      <div className="surface-ink grain mx-auto max-w-[1320px] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-float)]">
        <div aria-hidden="true" className="road-dash h-1 w-full opacity-80" />
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:gap-12">
          <div className="min-w-0 flex-1">
            <p className="label-ticket flex items-center gap-2 text-highlight">
              <Cookie className="size-3.5" aria-hidden="true" />
              {t('banner.eyebrow')}
            </p>
            <h2
              id="titre-bandeau-consentement"
              className="mt-2 font-display text-xl font-bold tracking-tight text-on-ink sm:text-2xl"
            >
              {t('banner.title')}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-ink-muted">
              {t('banner.body')}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:flex lg:shrink-0 lg:flex-col xl:flex-row">
            <Button variant="inverse" onClick={onRefuseAll}>
              {t('banner.refuseAll')}
            </Button>
            <Button variant="inverse" onClick={onAcceptAll}>
              {t('banner.acceptAll')}
            </Button>
            <Button variant="glass" onClick={onCustomize}>
              {t('banner.customize')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
