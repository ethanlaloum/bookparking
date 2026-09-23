import { useTranslation } from 'react-i18next';

import { ConsentManager } from './components/ConsentManager';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Routes } from './routes/Routes';

export const App = () => {
  const { t } = useTranslation('common');

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
    </div>
  );
};
