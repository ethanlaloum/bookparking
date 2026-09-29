import { useTranslation } from 'react-i18next';

import { BookingCelebration } from './components/BookingCelebration';
import { ConsentManager } from './components/ConsentManager';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { useScrollToTopOnNavigation } from './hooks/useScrollToTopOnNavigation';
import { Routes } from './routes/Routes';
import { selectIsAuthenticated } from './selectors/auth/authSelectors';
import { useAppSelector } from './store/redux';

export const App = () => {
  const { t } = useTranslation('common');
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  useScrollToTopOnNavigation();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only rounded-xl bg-brand px-4 py-2.5 font-medium text-on-brand shadow-[var(--shadow-brand)] focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        {t('skipToContent')}
      </a>
      <Header />
      <main id="contenu" className="flex-1">
        <Routes />
      </main>
      <Footer />
      <ConsentManager />
      {isAuthenticated && <BookingCelebration />}
    </div>
  );
};
