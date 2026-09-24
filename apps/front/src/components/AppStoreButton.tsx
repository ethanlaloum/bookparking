import { Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { appStoreUrl } from '../lib/appStore';
import { cn } from '../lib/cn';

const BADGE =
  'inline-flex items-center gap-3 rounded-2xl px-5 py-3 text-left ring-1 ring-inset transition-[translate,background-color,box-shadow] duration-200';

/**
 * Le bouton de téléchargement. Publiée, l'app s'ouvre sur sa fiche ; pas
 * encore, le badge reste visible mais inerte, et dit « Bientôt ».
 */
export const AppStoreButton = ({ className }: { className?: string }) => {
  const { t } = useTranslation('mobileApp');
  const url = appStoreUrl();

  const content = (
    <>
      <Smartphone className="size-7 shrink-0" aria-hidden="true" />
      <span className="flex flex-col leading-tight">
        <span className="text-[0.7rem] font-medium tracking-wide uppercase opacity-70">
          {t('store.iphoneOnly')}
        </span>
        <span className="font-display text-lg font-semibold">
          {url === null ? t('store.soon') : t('store.download')}
        </span>
      </span>
    </>
  );

  return url === null ? (
    <span
      aria-disabled="true"
      className={cn(BADGE, 'cursor-default bg-white/5 text-on-ink ring-white/15', className)}
    >
      {content}
    </span>
  ) : (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        BADGE,
        'bg-white text-asphalt-950 ring-transparent hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-16px_rgb(0_0_0/0.7)]',
        className,
      )}
    >
      {content}
    </a>
  );
};
