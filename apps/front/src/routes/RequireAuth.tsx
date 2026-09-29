import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { selectAccountDeleted } from '../selectors/account/accountSelectors';
import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import { useAppSelector } from '../store/redux';

export const RequireAuth = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accountDeleted = useAppSelector(selectAccountDeleted);
  const location = useLocation();

  // La suppression déconnecte aussitôt : sans cette exception, la page du
  // compte qui vient de disparaître renverrait vers la connexion.
  if (!isAuthenticated && accountDeleted) return <Navigate to="/compte-supprime" replace />;

  if (!isAuthenticated)
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;

  return <Outlet />;
};
