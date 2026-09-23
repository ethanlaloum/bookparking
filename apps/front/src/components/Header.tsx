import { LogOut, Plus, Search, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';

import { logoutRequested } from '../app/auth/domain/use-cases/sign-out/signOutEpic';
import { cn } from '../lib/cn';
import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { BrandLink } from './BrandLink';
import { buttonVariants } from './ui/buttonVariants';

export const Header = () => {
  const { t } = useTranslation(['common', 'listing']);
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <BrandLink className="text-fg" />

        <nav aria-label={t('common:nav.browse')} className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <NavLink
            to="/recherche"
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'px-2.5 sm:px-3.5',
                isActive && 'bg-bg-sunken font-semibold text-fg',
              )
            }
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t('listing:map.nav')}</span>
          </NavLink>

          {isAuthenticated ? (
            <>
              <Link
                to="/publier"
                aria-label={t('common:nav.publish')}
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'px-2.5 sm:px-3.5')}
              >
                <Plus className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('common:nav.publish')}</span>
              </Link>
              <Link
                to="/compte"
                aria-label={t('common:nav.account')}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-2 px-1.5 md:pr-3.5')}
              >
                <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-signal-400 to-signal-700 text-white ring-2 ring-bg">
                  <UserRound className="size-3.5" aria-hidden="true" />
                </span>
                <span className="hidden md:inline">{t('common:nav.account')}</span>
              </Link>
              {/* Sur un téléphone, la déconnexion vit dans l'onglet « Réglages » du
                  compte : quatre boutons ne tiennent pas à côté de la marque. */}
              <button
                type="button"
                onClick={() => dispatch(logoutRequested())}
                aria-label={t('common:nav.signOut')}
                title={t('common:nav.signOut')}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden px-2.5 sm:inline-flex')}
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                {t('common:nav.signIn')}
              </Link>
              <Link to="/inscription" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                {t('common:nav.register')}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
