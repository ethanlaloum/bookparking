import { MapIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/button';

/**
 * Ce qui tient la place de la carte tant qu'OpenStreetMap n'est pas autorisé.
 * Le bouton n'accorde que la carte : les polices gardent la réponse qu'elles
 * avaient, et le texte dit où retirer ce choix.
 */
export const MapConsentPlaceholder = ({ onShow }: { onShow: () => void }) => {
  const { t } = useTranslation('consent');

  return (
    // Les hachures d'une zone où l'on ne se gare pas : la place de la carte
    // reste marquée au sol, mais rien n'y est posé tant qu'on n'a pas dit oui.
    <div className="grid h-full place-items-center bg-hatch p-4 sm:p-6">
      <div className="flex max-w-sm flex-col items-center rounded-3xl border border-line bg-bg-raised px-6 py-7 text-center shadow-[var(--shadow-lift)]">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <MapIcon className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-fg">
          {t('mapPlaceholder.title')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t('mapPlaceholder.body')}</p>
        <Button className="mt-5" onClick={onShow}>
          {t('mapPlaceholder.show')}
        </Button>
        <p className="mt-3 text-xs text-fg-subtle">{t('mapPlaceholder.hint')}</p>
      </div>
    </div>
  );
};
