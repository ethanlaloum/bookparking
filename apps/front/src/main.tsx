import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import './index.css';
import './lib/i18n';
import { createAppStore } from './store/redux';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const container = document.getElementById('root');
if (container === null) throw new Error('Le point de montage #root est introuvable');

createRoot(container).render(
  <StrictMode>
    <Provider store={createAppStore(API_BASE_URL)}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
