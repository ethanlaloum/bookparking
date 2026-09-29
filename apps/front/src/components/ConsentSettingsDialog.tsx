import { Cookie, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ConsentChoices, ConsentPurpose } from '../app/consent/domain/entities/Consent';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

interface ConsentSettingsDialogProps {
  open: boolean;
  choices: ConsentChoices;
  onSave: (choices: ConsentChoices) => void;
  onAcceptAll: () => void;
  onRefuseAll: () => void;
  onClose: () => void;
}

const PURPOSES: readonly ConsentPurpose[] = ['map', 'fonts'];

/**
 * Muette : elle part des réponses qu'on lui donne et rend celles qu'on a
 * choisies. Le brouillon des interrupteurs vit dans `SettingsBody`, monté à
 * chaque ouverture : il repart ainsi de la décision enregistrée sans aucun
 * `setState` dans un `useEffect`.
 */
export const ConsentSettingsDialog = ({ open, ...props }: ConsentSettingsDialogProps) =>
  open ? <SettingsBody {...props} /> : null;

const SettingsBody = ({
  choices,
  onSave,
  onAcceptAll,
  onRefuseAll,
  onClose,
}: Omit<ConsentSettingsDialogProps, 'open'>) => {
  const { t } = useTranslation(['consent', 'common']);
  const [draft, setDraft] = useState<ConsentChoices>(choices);

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-asphalt-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-reglages-consentement"
        className="animate-rise max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-bg-raised shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start gap-4 p-6 pb-0 sm:p-7 sm:pb-0">
          <div className="min-w-0 flex-1">
            <p className="label-ticket flex items-center gap-2 text-accent">
              <Cookie className="size-3.5" aria-hidden="true" />
              {t('consent:settings.eyebrow')}
            </p>
            <h2
              id="titre-reglages-consentement"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-fg"
            >
              {t('consent:settings.title')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            autoFocus
            onClick={onClose}
            aria-label={t('common:action.close')}
            className="-mt-1 -mr-2 size-10 px-0"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <p className="px-6 pt-3 text-sm leading-relaxed text-fg-muted sm:px-7">
          {t('consent:settings.intro')}
        </p>

        <ul className="mt-5 divide-y divide-line border-y border-line">
          <li className="bg-bg-sunken/60 px-6 py-4 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-fg">{t('consent:settings.necessary.title')}</p>
              <Badge tone="ok">{t('consent:settings.necessary.status')}</Badge>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              {t('consent:settings.necessary.body')}
            </p>
          </li>

          {PURPOSES.map((purpose) => (
            <li key={purpose} className="px-6 py-4 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <p id={`finalite-${purpose}`} className="font-semibold text-fg">
                  {t(`consent:settings.${purpose}.label`)}
                </p>
                <Switch
                  checked={draft[purpose]}
                  aria-labelledby={`finalite-${purpose}`}
                  aria-describedby={`finalite-${purpose}-detail`}
                  onCheckedChange={(checked) =>
                    setDraft((current) => ({ ...current, [purpose]: checked }))
                  }
                />
              </div>
              <p
                id={`finalite-${purpose}-detail`}
                className="mt-1.5 text-sm leading-relaxed text-fg-muted"
              >
                {t(`consent:settings.${purpose}.body`)}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex flex-col-reverse gap-2 p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" onClick={onRefuseAll}>
              {t('consent:settings.refuseAll')}
            </Button>
            <Button variant="outline" onClick={onAcceptAll}>
              {t('consent:settings.acceptAll')}
            </Button>
          </div>
          <Button className="sm:ml-auto" onClick={() => onSave(draft)}>
            {t('consent:settings.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};
