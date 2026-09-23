import { ArrowUpRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { BrandLink } from './BrandLink';

const LINK =
  'group inline-flex items-center gap-1.5 rounded-md text-on-ink transition-colors hover:text-highlight';

export const Footer = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="mt-auto px-3 pt-16 pb-3 sm:px-4">
      <div className="surface-ink grain relative overflow-hidden rounded-[2rem]">
        {/* La ligne discontinue de marquage : le seul endroit où le jaune court
            sur toute la largeur. */}
        <div aria-hidden="true" className="road-dash h-1 w-full opacity-80" />

        <div className="relative mx-auto max-w-[1320px] px-6 pt-14 pb-6 sm:px-10">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <BrandLink className="text-on-ink" />
              <p className="mt-4 text-lg leading-snug text-on-ink-muted">{t('tagline')}</p>
              <p className="label-ticket mt-6 flex items-center gap-2 text-on-ink-muted">
                <MapPin className="size-3.5 text-highlight" aria-hidden="true" />
                {t('footer.city')}
              </p>
            </div>

            <nav aria-label={t('footer.explore')}>
              <p className="label-ticket text-on-ink-muted">{t('footer.explore')}</p>
              <ul className="mt-4 flex flex-col gap-3 text-[0.95rem]">
                <li>
                  <Link to="/recherche" className={LINK}>
                    {t('footer.search')}
                    <ArrowUpRight
                      className="size-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
                <li>
                  <Link to="/publier" className={LINK}>
                    {t('nav.publish')}
                    <ArrowUpRight
                      className="size-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <p
            aria-hidden="true"
            className="mt-14 -mb-[0.14em] font-display text-[clamp(3.5rem,16.5vw,14.5rem)] leading-[0.8] font-extrabold tracking-[-0.06em] text-white/[0.07] select-none"
          >
            {t('brand')}
          </p>

          <div className="tabular relative flex flex-col gap-2 border-t border-ink-line pt-5 text-xs text-on-ink-muted sm:flex-row sm:justify-between">
            <span>
              © {new Date().getFullYear()} {t('brand')}
            </span>
            <span>{t('footer.madeIn')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
