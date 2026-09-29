import { ArrowUpRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { consentSettingsOpened } from '../app/consent/store/consentSettings';
import { useAppDispatch } from '../store/redux';
import { BrandLink } from './BrandLink';

const LINK =
  'group inline-flex items-center gap-1.5 rounded-md text-on-ink transition-colors hover:text-highlight';

const FooterNav = ({ title, links }: { title: string; links: { to: string; label: string }[] }) => (
  <nav aria-label={title}>
    <p className="label-ticket text-on-ink-muted">{title}</p>
    <ul className="mt-4 flex flex-col gap-3 text-[0.95rem]">
      {links.map((link) => (
        <li key={link.to}>
          <Link to={link.to} className={LINK}>
            {link.label}
            <ArrowUpRight
              className="size-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

export const Footer = () => {
  const { t } = useTranslation(['common', 'consent']);
  const dispatch = useAppDispatch();

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

            <div className="flex flex-col gap-12 sm:flex-row sm:gap-20">
              <FooterNav
                title={t('footer.explore')}
                links={[
                  { to: '/recherche', label: t('footer.search') },
                  { to: '/publier', label: t('nav.publish') },
                  { to: '/faq', label: t('footer.faq') },
                  { to: '/application', label: t('footer.app') },
                ]}
              />
              <FooterNav
                title={t('footer.legal')}
                links={[
                  { to: '/mentions-legales', label: t('footer.legalNotice') },
                  { to: '/donnees-personnelles', label: t('footer.privacy') },
                  { to: '/conditions-d-utilisation', label: t('footer.terms') },
                ]}
              />
            </div>
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
            {/* Retirer son accord doit être aussi simple que le donner : le
                panneau se rouvre depuis chaque page, pas seulement depuis le
                bandeau qui a disparu une fois la décision prise. */}
            <button
              type="button"
              onClick={() => dispatch(consentSettingsOpened())}
              className="cursor-pointer self-start rounded-md underline decoration-on-ink-muted/40 underline-offset-4 transition-colors hover:text-highlight hover:decoration-highlight sm:self-auto"
            >
              {t('consent:manage')}
            </button>
            <span>{t('footer.madeIn')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
