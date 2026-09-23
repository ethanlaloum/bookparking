import {
  ArrowRight,
  CalendarRange,
  KeyRound,
  MapPinned,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import {
  criteriaToSearchParams,
  EMPTY_CRITERIA,
} from '../app/listing/domain/entities/SearchCriteria';
import { listListingsRequested } from '../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { ParkingLotIllustration } from '../components/art/ParkingLotIllustration';
import { RivieraMap } from '../components/art/RivieraMap';
import { ParkingMark } from '../components/ParkingMark';
import { SearchBar } from '../components/SearchBar';
import { Badge } from '../components/ui/badge';
import { buttonVariants } from '../components/ui/buttonVariants';
import { cn } from '../lib/cn';
import { formatCents } from '../lib/format';
import {
  selectCheapestRateInCents,
  selectListings,
  selectListingsLoaded,
  selectListingsLoading,
} from '../selectors/listing/listingSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

const STEPS: readonly { key: string; icon: LucideIcon }[] = [
  { key: 'search', icon: MapPinned },
  { key: 'dates', icon: CalendarRange },
  { key: 'park', icon: KeyRound },
];

const stagger = (index: number): CSSProperties => ({ '--i': index }) as CSSProperties;

export const HomePage = () => {
  const { t } = useTranslation(['listing', 'common', 'account']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const listings = useAppSelector(selectListings);
  const loaded = useAppSelector(selectListingsLoaded);
  const loading = useAppSelector(selectListingsLoading);
  const cheapest = useAppSelector(selectCheapestRateInCents);

  // Les annonces ne sont pas affichées ici, mais le tarif d'appel du hero en
  // vient : c'est le seul chiffre de cette page, et il doit être vrai.
  useEffect(() => {
    if (!loaded && !loading) dispatch(listListingsRequested());
  }, [dispatch, loaded, loading]);

  const goToSearch = (params: string): void => {
    void navigate(params === '' ? '/recherche' : `/recherche?${params}`);
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Hero : l'encre, le parking qui se remplit, la barre de recherche.   */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-3 pt-3 sm:px-4">
        {/* Pas d'`overflow-hidden` ici : la barre de recherche est au bas du
            bloc, et ses listes (véhicule, durée, suggestions d'adresse)
            s'ouvrent vers le bas — rognées au bord, on n'en voyait que le
            haut. Seule la couche décorative est rognée aux coins arrondis, et
            `z-10` fait passer les listes au-dessus des sections suivantes. */}
        <div className="surface-ink grain relative z-10 rounded-[2rem] ring-1 ring-white/[0.06] ring-inset">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          >
            <div className="bg-blueprint absolute inset-0" />
          </div>

          <div className="relative mx-auto max-w-[1320px] px-5 pt-10 pb-8 sm:px-10 lg:pt-12 lg:pb-10">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p
                  className="animate-rise inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1.5 pr-3.5 pl-2.5 text-sm text-on-ink-muted backdrop-blur-sm"
                  style={stagger(0)}
                >
                  <span className="relative grid size-2 place-items-center">
                    <span className="animate-pulse-ring absolute inset-0 rounded-full bg-green-400" />
                    <span className="relative size-2 rounded-full bg-green-400" />
                  </span>
                  {/* Sur un téléphone, le compte suffit : les deux ne tiennent pas
                      sur une ligne, et une pastille ne se lit pas sur trois. */}
                  <span className={loaded && listings.length > 0 ? 'hidden sm:inline' : undefined}>
                    {t('listing:home.live')}
                  </span>
                  {loaded && listings.length > 0 && (
                    <>
                      <span aria-hidden="true" className="hidden text-white/25 sm:inline">
                        ·
                      </span>
                      <span className="tabular font-medium text-on-ink">
                        {t('listing:home.available', { count: listings.length })}
                      </span>
                    </>
                  )}
                </p>

                <h1
                  className="animate-rise mt-6 font-display text-[clamp(2.35rem,5.6vw,4.9rem)] leading-[0.92] font-extrabold tracking-[-0.045em] text-on-ink"
                  style={stagger(1)}
                >
                  <span className="block">{t('listing:home.heroLead')}</span>{' '}
                  <span className="relative inline-block text-highlight">
                    {t('listing:home.heroAccent')}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 300 12"
                      preserveAspectRatio="none"
                      className="absolute -bottom-2 left-0 h-3 w-full text-highlight/60"
                    >
                      <path
                        d="M2 8 Q 75 2 150 6 T 298 5"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>

                <p
                  className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-on-ink-muted"
                  style={stagger(2)}
                >
                  {t('listing:home.pitch')}
                </p>

              </div>

              {/* Sur grand écran, le ticket se pose sur le parking ; sur mobile,
                  où l'illustration disparaît, il suit simplement le texte. */}
              <div className="relative lg:col-span-5">
                <div className="animate-fade hidden lg:block" style={stagger(4)}>
                  <ParkingLotIllustration className="mx-auto w-full max-w-[34rem]" />
                </div>
                  {cheapest !== null && (
                    <div className="animate-rise lg:absolute lg:-bottom-4 lg:-left-6 lg:z-10" style={stagger(3)}>
                      {/* Le ticket d'horodateur : le tarif d'appel, imprimé. */}
                      <div className="inline-flex -rotate-2 items-stretch rounded-2xl bg-[#f7f4ea] text-asphalt-950 shadow-[0_24px_40px_-20px_rgb(0_0_0/0.8)] transition-transform duration-300 ease-[var(--ease-spring)] hover:rotate-0">
                        <div className="px-5 py-4">
                          <p className="label-ticket text-asphalt-500">{t('listing:home.ticket.title')}</p>
                          <p className="tabular mt-1.5 flex items-baseline gap-2 whitespace-nowrap">
                            <span className="text-sm text-asphalt-600">{t('listing:card.from')}</span>
                            <span className="font-display text-4xl leading-none font-extrabold tracking-[-0.04em] sm:text-[2.6rem]">
                              {formatCents(cheapest)}
                            </span>
                            <span className="text-sm text-asphalt-600">{t('common:unit.perNight')}</span>
                          </p>
                          <p className="mt-2 max-w-[15rem] text-xs leading-snug text-asphalt-500">
                            {t('listing:home.ticket.caption')}
                          </p>
                        </div>
                        <div className="relative flex flex-col items-center justify-center gap-1.5 border-l-2 border-dashed border-asphalt-300 px-4 before:absolute before:-top-2 before:-left-[9px] before:size-4 before:rounded-full before:bg-ink after:absolute after:-bottom-2 after:-left-[9px] after:size-4 after:rounded-full after:bg-ink">
                          <ParkingMark className="size-8" />
                          <span className="label-ticket text-[0.6rem] text-asphalt-500">Nice</span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="animate-rise relative mt-10" style={stagger(4)}>
              <SearchBar
                initial={EMPTY_CRITERIA}
                submitLabel={t('listing:criteria.search')}
                onSubmit={(criteria) => goToSearch(criteriaToSearchParams(criteria).toString())}
              />
            </div>

            <Link
              to="/recherche"
              className="group mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-on-ink-muted transition-colors hover:text-on-ink"
            >
              {t('listing:home.seeAll')}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Comment ça marche : trois gestes, reliés par l'axe de l'allée.      */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-[1320px] px-4 pt-24 sm:px-6 lg:pt-32">
        <div className="max-w-2xl">
          <p className="label-ticket text-accent">{t('listing:home.how.eyebrow')}</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02] font-bold text-fg">
            {t('listing:home.how.title')}
          </h2>
        </div>

        <div className="relative mt-14">
          {/* L'axe de l'allée relie les trois gestes. */}
          <div
            aria-hidden="true"
            className="absolute top-[3.25rem] right-[16%] left-[16%] hidden h-[3px] opacity-60 lg:block"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, var(--line-strong) 0 18px, transparent 18px 32px)',
            }}
          />
          <ol className="relative grid gap-5 lg:grid-cols-3 lg:gap-6">
          {STEPS.map(({ key, icon: Icon }, index) => (
            <li
              key={key}
              className="group relative flex flex-col rounded-3xl border border-line bg-bg-raised p-7 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-brand text-on-brand shadow-[var(--shadow-brand)] transition-transform duration-300 ease-[var(--ease-spring)] group-hover:-rotate-6">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span
                  aria-hidden="true"
                  className="text-outline font-display text-6xl leading-none font-extrabold text-line-strong"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-8 font-display text-xl font-semibold text-fg">
                {t(`listing:home.how.step.${key}.title`)}
              </h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                {t(`listing:home.how.step.${key}.body`)}
              </p>
            </li>
          ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Trois promesses, en bento : la ville, le prix, la confirmation.    */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-[1320px] px-4 pt-24 sm:px-6 lg:pt-32">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="label-ticket text-accent">{t('listing:home.why.eyebrow')}</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02] font-bold text-fg">
              {t('listing:home.why.title')}
            </h2>
          </div>
        </div>

        <ul className="mt-14 grid gap-5 lg:grid-cols-12 lg:grid-rows-2 lg:gap-6">
          <li className="surface-ink grain relative flex min-h-[28rem] flex-col overflow-hidden rounded-3xl p-7 ring-1 ring-white/[0.06] ring-inset sm:p-9 lg:col-span-7 lg:row-span-2">
            <RivieraMap className="absolute inset-x-0 bottom-0 !h-[72%]" />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-ink via-ink/85 to-transparent"
            />
            <div className="relative">
              <p className="label-ticket text-highlight">43,70° N · 7,27° E</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-on-ink sm:text-4xl">
                {t('listing:home.argument.local.title')}
              </h3>
              <p className="mt-3 max-w-md leading-relaxed text-on-ink-muted">
                {t('listing:home.argument.local.body')}
              </p>
            </div>
          </li>

          <li className="relative flex flex-col justify-between gap-10 overflow-hidden rounded-3xl border border-line bg-bg-raised p-7 sm:p-9 lg:col-span-5">
            <p className="tabular flex items-baseline gap-3">
              <span className="font-display text-7xl leading-none font-extrabold tracking-[-0.05em] text-accent">
                {formatCents(0)}
              </span>
              <span className="max-w-[10rem] text-sm leading-snug text-fg-muted">
                {t('listing:home.why.noFees')}
              </span>
            </p>
            <div>
              <h3 className="font-display text-2xl font-bold text-fg">
                {t('listing:home.argument.price.title')}
              </h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                {t('listing:home.argument.price.body')}
              </p>
            </div>
          </li>

          <li className="relative flex flex-col justify-between gap-10 overflow-hidden rounded-3xl border border-line bg-bg-raised p-7 sm:p-9 lg:col-span-5">
            <div aria-hidden="true" className="flex flex-wrap items-center gap-2.5">
              <Badge tone="warn" className="px-3 py-1.5 text-sm">
                {t('account:status.PENDING')}
              </Badge>
              <ArrowRight className="size-4 text-fg-subtle" />
              <Badge tone="ok" className="px-3 py-1.5 text-sm">
                {t('account:status.CONFIRMED')}
              </Badge>
              <span className="mx-1 h-5 w-px bg-line" />
              <Badge tone="neutral" className="px-3 py-1.5 text-sm opacity-70">
                {t('account:status.EXPIRED')}
              </Badge>
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-fg">
                {t('listing:home.argument.trust.title')}
              </h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                {t('listing:home.argument.trust.body')}
              </p>
            </div>
          </li>
        </ul>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Aux propriétaires : le bleu panneau, en plein.                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-3 pt-24 sm:px-4 lg:pt-32">
        <div className="grain relative overflow-hidden rounded-[2rem] bg-signal-600 text-white">
          <svg
            viewBox="-1 -1 34 34"
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 -bottom-40 size-[36rem] rotate-12 text-white opacity-[0.14] lg:-right-6 lg:-bottom-28"
          >
            <rect width="32" height="32" rx="7" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <path
              d="M11 24V8h6.4c3.5 0 5.6 2 5.6 5.1s-2.1 5.2-5.6 5.2h-2.6V24H11zm3.8-8.6h2.2c1.6 0 2.6-.9 2.6-2.3s-1-2.2-2.6-2.2h-2.2v4.5z"
              fill="currentColor"
            />
          </svg>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_0%,rgb(255_255_255/0.16),transparent_60%)]"
          />

          <div className="relative mx-auto max-w-[1320px] px-6 py-16 sm:px-10 lg:py-24">
            <div className="max-w-3xl">
              <p className="label-ticket text-white/85">{t('listing:home.owner.eyebrow')}</p>
              <h2 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.96] font-extrabold tracking-[-0.04em]">
                {t('listing:home.owner.title')}
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
                {t('listing:home.owner.body')}
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/publier" className={buttonVariants({ variant: 'inverse', size: 'lg' })}>
                  <Plus className="size-5" aria-hidden="true" />
                  {t('common:nav.publish')}
                </Link>
                <Link
                  to="/recherche"
                  className={cn(buttonVariants({ variant: 'glass', size: 'lg' }), 'font-medium')}
                >
                  {t('common:footer.search')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
