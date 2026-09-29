import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { selectIsAuthenticated } from '../selectors/authSelectors';
import { useAppSelector } from '../store/redux';

export const RequireSession = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated)
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;

  return <Outlet />;
};
