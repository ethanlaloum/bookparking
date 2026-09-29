import { configureStore, type Action } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { createEpicMiddleware } from 'redux-observable';

import { isSessionLive } from '../app/auth/domain/entities/Session';
import { buildInitialAuthState } from '../app/auth/store/AuthSlice';
import { restoreConsent } from '../app/consent/domain/entities/Consent';
import { buildInitialConsentState } from '../app/consent/store/ConsentSlice';
import type { AppState } from './AppState';
import { buildDependencies } from './buildDependencies';
import { coreReducer } from './coreReducer';
import type { Dependencies } from './dependencies.interface';
import { rootEpic } from './epics';

const INIT: Action = { type: '@@bookparking/init' };

export const createAppStore = (baseUrl: string) => {
  const dependencies = buildDependencies(baseUrl);

  const epicMiddleware = createEpicMiddleware<Action, Action, AppState, Dependencies>({
    dependencies,
  });

  const stored = dependencies.sessionStore.read();
  const session = isSessionLive(stored, new Date()) ? stored : null;
  if (stored !== null && session === null) dependencies.sessionStore.clear();

  // Une décision périmée ou d'une version antérieure vaut absence : le bandeau
  // réapparaît, et rien de tiers ne se charge d'ici là.
  const consent = restoreConsent(dependencies.consentStore.read(), dependencies.clock.now());

  const store = configureStore({
    reducer: { core: coreReducer },
    preloadedState: {
      core: {
        ...coreReducer(undefined, INIT),
        auth: buildInitialAuthState(session),
        consent: buildInitialConsentState(consent),
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false }).concat(epicMiddleware),
  });

  epicMiddleware.run(rootEpic);

  return store;
};

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<AppState>();
