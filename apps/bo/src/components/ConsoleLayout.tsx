import { LogOut, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { ParkingMark } from '@front/components/ParkingMark';
import { Notice } from '@front/components/Notice';
import { Button } from '@front/components/ui/button';
import { cn } from '@front/lib/cn';

import { logoutRequested } from '../app/auth/domain/use-cases/sign-out/signOutEpic';
import { selectAdminAccess } from '../selectors/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { SECTIONS } from './sections';

const NAV_CLASS =
  'inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-200';

export const ConsoleLayout = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  // Un compte révoqué pendant qu'il travaille garde un jeton valide : c'est le
  // 403 de la lecture suivante qui l'apprend à l'écran.
  const revoked = useAppSelector(selectAdminAccess) === 'denied';
  const signOut = () => dispatch(logoutRequested());

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only rounded-xl bg-brand px-4 py-2.5 font-medium text-on-brand shadow-[var(--shadow-brand)] focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        {t('common:skipToContent')}
      </a>

      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg text-fg">
            <ParkingMark className="size-8" />
            <span className="font-display text-[1.1rem] font-bold tracking-[-0.03em] max-[22rem]:sr-only sm:text-[1.2rem]">
              {t('common:brand')}
            </span>
            <span className="label-ticket inline-flex items-center gap-1.5 rounded-full bg-warn-bg px-2.5 py-1 text-warn ring-1 ring-warn/25 ring-inset">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {t('admin:console.name')}
            </span>
          </Link>
          <Button variant="ghost" size="sm" className="ml-auto gap-2 px-2.5" onClick={signOut}>
            <LogOut className="size-4" aria-hidden="true" />
            <span className="max-sm:sr-only">{t('admin:console.signOut')}</span>
          </Button>
        </div>
      </header>

      <main id="contenu" className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-6 pb-16 sm:px-6">
        <nav aria-label={t('admin:console.nav')} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-1 rounded-2xl bg-bg-sunken p-1 ring-1 ring-line ring-inset">
            {SECTIONS.map((section) => (
              <li key={section.name}>
                <NavLink
                  to={section.path}
                  end
                  className={({ isActive }) =>
                    cn(
                      NAV_CLASS,
                      isActive
                        ? 'bg-bg-raised font-semibold text-fg shadow-[var(--shadow-panel)] ring-1 ring-line-strong'
                        : 'text-fg-muted hover:text-fg',
                    )
                  }
                >
                  {t(`admin:console.section.${section.name}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-6 rounded-xl border border-warn/30 bg-warn-bg px-3.5 py-2.5 text-center text-xs font-medium text-warn">
          {t('admin:banner')}
        </p>

        <div className="mt-8">
          {revoked ? (
            <div className="flex max-w-xl flex-col items-start gap-4">
              <Notice tone="error" title={t('admin:revoked.title')}>
                {t('admin:revoked.body')}
              </Notice>
              <Button variant="outline" onClick={signOut}>
                {t('admin:console.signOut')}
              </Button>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};
