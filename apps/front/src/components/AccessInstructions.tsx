import { Check, Copy, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../lib/cn';

/**
 * Les consignes du loueur, telles qu'il les a écrites : digicode, étage,
 * repères. Un ticket à part dans la ligne, pour qu'on les retrouve d'un coup
 * d'œil devant le portail, et un bouton pour les copier.
 */
export const AccessInstructions = ({
  instructions,
  className,
}: {
  instructions: string;
  className?: string;
}) => {
  const { t } = useTranslation('account');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    void navigator.clipboard?.writeText(instructions).then(() => setCopied(true));
  };

  return (
    <section
      aria-label={t('access.title')}
      className={cn(
        'animate-rise relative overflow-hidden rounded-xl border border-ok/30 bg-ok-bg/60 px-4 py-3.5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ok/15 text-ok">
          <KeyRound className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="label-ticket text-ok">{t('access.title')}</p>
          <p className="mt-1 text-sm leading-relaxed font-medium whitespace-pre-line text-fg">
            {instructions}
          </p>
          <p className="mt-1.5 text-xs text-fg-muted">{t('access.hint')}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? t('access.copied') : t('access.copy')}
          title={copied ? t('access.copied') : t('access.copy')}
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-fg-muted transition-colors hover:bg-ok/15 hover:text-fg"
        >
          {copied ? (
            <Check className="size-4 text-ok" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </section>
  );
};
