import { LogOut, Plus, Search, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';

import { logoutRequested } from '../app/auth/domain/use-cases/sign-out/signOutEpic';
import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { BrandLink } from './BrandLink';
import { buttonVariants } from './ui/buttonVariants';
import { cn } from '../lib/cn';

export const Header = () => {
  const { t } = useTranslation(['common', 'listing']);
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <BrandLink />

        <nav aria-label={t('common:nav.browse')} className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                isActive && 'text-fg font-semibold',
              )
            }
          >
            {t('common:nav.browse')}
          </NavLink>

          <NavLink
            to="/recherche"
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                isActive && 'text-fg font-semibold',
              )
            }
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('listing:map.nav')}</span>
          </NavLink>

          {isAuthenticated ? (
            <>
              <Link
                to="/publier"
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'hidden sm:inline-flex')}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t('common:nav.publish')}
              </Link>
              <Link
                to="/compte"
                aria-label={t('common:nav.account')}
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                <UserRound className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('common:nav.account')}</span>
              </Link>
              <button
                type="button"
                onClick={() => dispatch(logoutRequested())}
                aria-label={t('common:nav.signOut')}
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
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
