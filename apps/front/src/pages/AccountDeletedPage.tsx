import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { resetDeleteAccountState } from '../app/account/domain/use-cases/delete-account/deleteAccountEpic';
import { AuthShell } from '../components/AuthShell';
import { buttonVariants } from '../components/ui/buttonVariants';
import { useAppDispatch } from '../store/redux';

// Une page sans état : rechargée, elle dit la même chose. En partant, elle
// rend à `RequireAuth` son chemin ordinaire vers la connexion.
export const AccountDeletedPage = () => {
  const { t } = useTranslation(['account']);
  const dispatch = useAppDispatch();

  useEffect(() => () => void dispatch(resetDeleteAccountState()), [dispatch]);

  return (
    <AuthShell
      title={t('account:deletion.doneTitle')}
      subtitle={t('account:deletion.done')}
      footer={
        <Link
          to="/donnees-personnelles"
          className="font-medium text-accent underline underline-offset-4"
        >
          {t('account:deletion.privacy')}
        </Link>
      }
    >
      <Link to="/" className={buttonVariants({ size: 'lg', block: true })}>
        {t('account:deletion.home')}
      </Link>
    </AuthShell>
  );
};
