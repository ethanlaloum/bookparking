import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ParkingLotIllustration } from './art/ParkingLotIllustration';
import { ParkingMark } from './ParkingMark';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const PROMISES = ['local', 'price', 'trust'] as const;

export const AuthShell = ({ title, subtitle, children, footer }: AuthShellProps) => {
  const { t } = useTranslation(['listing', 'common']);

  return (
    <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2 lg:py-6">
      <div className="flex flex-col justify-center lg:py-10">
        <div className="animate-rise mx-auto w-full max-w-md">
          <ParkingMark className="size-11" />
          <h1 className="mt-8 font-display text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.02] font-bold text-fg">
            {title}
          </h1>
          <p className="mt-3 text-lg text-fg-muted">{subtitle}</p>
          <div className="mt-10 flex flex-col gap-4">{children}</div>
          <div className="mt-10 border-t border-line pt-6 text-sm text-fg-muted">{footer}</div>
        </div>
      </div>

      {/* Le panneau de droite ne dit rien que l'accueil ne dise déjà : il
          rappelle où l'on est, et ce que le compte permet. */}
      <div className="surface-ink grain relative hidden flex-col justify-between gap-8 overflow-hidden rounded-[2rem] p-10 ring-1 ring-white/[0.06] ring-inset lg:flex xl:p-12">
        <div aria-hidden="true" className="bg-blueprint absolute inset-0" />
        <ParkingLotIllustration className="relative mx-auto w-full max-w-[22rem] pt-6" />
        <div className="relative">
          <p className="label-ticket text-highlight">{t('common:footer.city')}</p>
          <p className="mt-3 max-w-md font-display text-3xl leading-tight font-semibold text-on-ink">
            {t('common:tagline')}
          </p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {PROMISES.map((key) => (
              <li key={key} className="flex items-center gap-3 text-sm text-on-ink-muted">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-highlight text-asphalt-950">
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {t(`listing:home.argument.${key}.title`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
