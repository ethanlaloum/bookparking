import { ArrowRight, MapPinned, ShieldCheck, Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import {
  criteriaToSearchParams,
  EMPTY_CRITERIA,
} from '../app/listing/domain/entities/SearchCriteria';
import { listListingsRequested } from '../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { ParkingMark } from '../components/ParkingMark';
import { SearchBar } from '../components/SearchBar';
import { buttonVariants } from '../components/ui/buttonVariants';
import { formatCents } from '../lib/format';
import {
  selectCheapestRateInCents,
  selectListings,
  selectListingsLoaded,
  selectListingsLoading,
} from '../selectors/listing/listingSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

const ARGUMENTS = [
  { key: 'local', icon: MapPinned },
  { key: 'price', icon: Wallet },
  { key: 'trust', icon: ShieldCheck },
] as const;

export const HomePage = () => {
  const { t } = useTranslation(['listing', 'common']);
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
      <section className="border-b border-line bg-bg-raised">
        <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              <ParkingMark className="size-4" />
              {t('common:brand')}
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.03] font-bold text-fg">
              {t('common:tagline')}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-fg-muted">
              {t('listing:home.pitch')}
            </p>

            <p className="tabular mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-fg-muted">
              {cheapest !== null && (
                <>
                  <span className="text-xs tracking-wide uppercase">{t('listing:card.from')}</span>
                  <span className="font-display text-3xl font-bold text-fg">
                    {formatCents(cheapest)}
                  </span>
                  <span className="text-sm">{t('common:unit.perNight')}</span>
                </>
              )}
              {loaded && listings.length > 0 && (
                <span className="text-sm text-fg-subtle">
                  · {t('listing:home.available', { count: listings.length })}
                </span>
              )}
            </p>
          </div>

          <div className="mt-10 rounded-[2px] border border-line-strong bg-bg p-5 shadow-[var(--shadow-panel)] lg:p-6">
            <SearchBar
              initial={EMPTY_CRITERIA}
              submitLabel={t('listing:criteria.search')}
              onSubmit={(criteria) => goToSearch(criteriaToSearchParams(criteria).toString())}
            />
          </div>

          <Link
            to="/recherche"
            className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} mt-4`}
          >
            {t('listing:home.seeAll')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6">
        <ul className="grid gap-8 sm:grid-cols-3">
          {ARGUMENTS.map(({ key, icon: Icon }) => (
            <li key={key}>
              <Icon className="size-5 text-accent" aria-hidden="true" />
              <h2 className="mt-3 font-display text-base font-semibold text-fg">
                {t(`listing:home.argument.${key}.title`)}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                {t(`listing:home.argument.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};
