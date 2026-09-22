import { lazy, Suspense } from 'react';
import { Route, Routes as RouterRoutes } from 'react-router-dom';

import { Loader } from '../components/Loader';
import { RequireAuth } from './RequireAuth';

const ListingsPage = lazy(async () => ({
  default: (await import('../pages/ListingsPage')).ListingsPage,
}));
const ListingDetailPage = lazy(async () => ({
  default: (await import('../pages/ListingDetailPage')).ListingDetailPage,
}));
const SignInPage = lazy(async () => ({
  default: (await import('../pages/SignInPage')).SignInPage,
}));
const RegisterPage = lazy(async () => ({
  default: (await import('../pages/RegisterPage')).RegisterPage,
}));
const PublishPage = lazy(async () => ({
  default: (await import('../pages/PublishPage')).PublishPage,
}));
const AccountPage = lazy(async () => ({
  default: (await import('../pages/AccountPage')).AccountPage,
}));
const ConfirmRequestPage = lazy(async () => ({
  default: (await import('../pages/ConfirmRequestPage')).ConfirmRequestPage,
}));
const NotFoundPage = lazy(async () => ({
  default: (await import('../pages/NotFoundPage')).NotFoundPage,
}));

export const Routes = () => (
  <Suspense fallback={<Loader />}>
    <RouterRoutes>
      <Route path="/" element={<ListingsPage />} />
      <Route path="/place/:id" element={<ListingDetailPage />} />
      <Route path="/connexion" element={<SignInPage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/publier" element={<PublishPage />} />
        <Route path="/compte" element={<AccountPage />} />
        <Route path="/demande/:requestId/confirmation" element={<ConfirmRequestPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </RouterRoutes>
  </Suspense>
);
