import { lazy, Suspense } from 'react';
import { Route, Routes as RouterRoutes } from 'react-router-dom';

import { Loader } from '../components/Loader';
import { RequireAuth } from './RequireAuth';

const HomePage = lazy(async () => ({
  default: (await import('../pages/HomePage')).HomePage,
}));
const ListingDetailPage = lazy(async () => ({
  default: (await import('../pages/ListingDetailPage')).ListingDetailPage,
}));
const SearchPage = lazy(async () => ({
  default: (await import('../pages/SearchPage')).SearchPage,
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
const PaymentReturnPage = lazy(async () => ({
  default: (await import('../pages/PaymentReturnPage')).PaymentReturnPage,
}));
const LegalNoticePage = lazy(async () => ({
  default: (await import('../pages/legal/LegalNoticePage')).LegalNoticePage,
}));
const PrivacyPage = lazy(async () => ({
  default: (await import('../pages/legal/PrivacyPage')).PrivacyPage,
}));
const TermsPage = lazy(async () => ({
  default: (await import('../pages/legal/TermsPage')).TermsPage,
}));
const NotFoundPage = lazy(async () => ({
  default: (await import('../pages/NotFoundPage')).NotFoundPage,
}));

export const Routes = () => (
  <Suspense fallback={<Loader />}>
    <RouterRoutes>
      <Route path="/" element={<HomePage />} />
      <Route path="/recherche" element={<SearchPage />} />
      <Route path="/place/:id" element={<ListingDetailPage />} />
      <Route path="/connexion" element={<SignInPage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route path="/mentions-legales" element={<LegalNoticePage />} />
      <Route path="/donnees-personnelles" element={<PrivacyPage />} />
      <Route path="/conditions-d-utilisation" element={<TermsPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/publier" element={<PublishPage />} />
        <Route path="/compte" element={<AccountPage />} />
        <Route path="/demande/:requestId/confirmation" element={<ConfirmRequestPage />} />
        <Route path="/demande/:requestId/paiement" element={<PaymentReturnPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </RouterRoutes>
  </Suspense>
);
