import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import { useAppSelector } from '../store/redux';

export const RequireAuth = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated)
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;

  return <Outlet />;
};
