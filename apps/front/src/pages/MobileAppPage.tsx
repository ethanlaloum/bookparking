import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  MapPinned,
  Plus,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { AppStoreButton } from '../components/AppStoreButton';
import { PhoneMockup } from '../components/art/PhoneMockup';
import { buttonVariants } from '../components/ui/buttonVariants';
import { appStoreUrl } from '../lib/appStore';
import { cn } from '../lib/cn';

// Chaque argument décrit un écran qui existe dans `apps/mobile` : la recherche
// et sa carte, le paiement par empreinte, l'onglet « Réservations », la
// publication et la confirmation des demandes reçues. L'annulation d'une
// réservation n'y est pas encore : elle n'est pas promise ici.
const FEATURES: readonly { key: string; icon: LucideIcon }[] = [
  { key: 'search', icon: MapPinned },
  { key: 'book', icon: CreditCard },
  { key: 'follow', icon: CalendarCheck },
  { key: 'publish', icon: Plus },
];

const stagger = (index: number): CSSProperties => ({ '--i': index }) as CSSProperties;

export const MobileAppPage = () => {
  const { t } = useTranslation(['mobileApp', 'common']);
  const published = appStoreUrl() !== null;

  return (
    <>
      <section className="px-3 pt-3 sm:px-4">
        <div className="surface-ink grain relative overflow-hidden rounded-[2rem] ring-1 ring-white/[0.06] ring-inset">
          <div aria-hidden="true" className="bg-blueprint pointer-events-none absolute inset-0" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -bottom-40 size-[34rem] rounded-full bg-signal-600/25 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-5 pt-12 pb-16 sm:px-10 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-7">
              <p className="animate-rise label-ticket text-highlight" style={stagger(0)}>
                {t('label')}
              </p>
              <h1
                className="animate-rise mt-5 font-display text-[clamp(2.35rem,5.6vw,4.9rem)] leading-[0.92] font-extrabold tracking-[-0.045em] text-on-ink"
                style={stagger(1)}
              >
                <span className="block">{t('hero.lead')}</span>{' '}
                <span className="text-highlight">{t('hero.accent')}</span>
              </h1>
              <p
                className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-on-ink-muted"
                style={stagger(2)}
              >
                {t('hero.pitch')}
              </p>
              <div className="animate-rise mt-9 flex flex-col items-start gap-3" style={stagger(3)}>
                <AppStoreButton />
                {!published && <p className="text-sm text-on-ink-muted">{t('store.meanwhile')}</p>}
              </div>
            </div>

            <div className="animate-fade flex justify-center lg:col-span-5" style={stagger(4)}>
              <PhoneMockup className="rotate-[5deg] transition-transform duration-500 ease-[var(--ease-spring)] hover:rotate-[2deg]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 pt-24 sm:px-6 lg:pt-32">
        <div className="max-w-2xl">
          <p className="label-ticket text-accent">{t('features.eyebrow')}</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02] font-bold text-fg">
            {t('features.title')}
          </h2>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {FEATURES.map(({ key, icon: Icon }) => (
            <li
              key={key}
              className="group flex flex-col rounded-3xl border border-line bg-bg-raised p-7 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-brand text-on-brand shadow-[var(--shadow-brand)] transition-transform duration-300 ease-[var(--ease-spring)] group-hover:-rotate-6">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-8 font-display text-xl font-semibold text-fg">
                {t(`features.${key}.title`)}
              </h3>
              <p className="mt-2 leading-relaxed text-fg-muted">{t(`features.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-[1320px] gap-5 px-4 pt-24 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:pt-32">
        <div className="flex flex-col justify-between gap-10 rounded-3xl border border-line bg-bg-raised p-7 sm:p-9 lg:col-span-5">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
            <RefreshCw className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold text-fg">{t('same.title')}</h2>
            <p className="mt-2 leading-relaxed text-fg-muted">{t('same.body')}</p>
          </div>
        </div>

        <div className="grain relative flex flex-col justify-between gap-10 overflow-hidden rounded-3xl bg-signal-600 p-7 text-white sm:p-9 lg:col-span-7">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_0%,rgb(255_255_255/0.16),transparent_60%)]"
          />
          <div className="relative">
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
              {t('cta.title')}
            </h2>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-white/85">{t('cta.body')}</p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <Link to="/recherche" className={buttonVariants({ variant: 'inverse', size: 'lg' })}>
              {t('cta.search')}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
            <Link
              to="/publier"
              className={cn(buttonVariants({ variant: 'glass', size: 'lg' }), 'font-medium')}
            >
              {t('common:nav.publish')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
