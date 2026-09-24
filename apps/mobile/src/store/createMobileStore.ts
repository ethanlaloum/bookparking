import { configureStore, type Action } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';

import { BookparkingRxAccountGateway } from '@front/app/account/adapters/RealAccountGateway';
import { isSessionLive } from '@front/app/auth/domain/entities/Session';
import { BookparkingRxSessionGateway } from '@front/app/auth/adapters/RealSessionGateway';
import { buildInitialAuthState } from '@front/app/auth/store/AuthSlice';
import { BookparkingRxBackOfficeGateway } from '@front/app/back-office/adapters/RealBackOfficeGateway';
import { SystemClock } from '@front/app/consent/adapters/SystemClock';
import { BanGeocodingGateway } from '@front/app/listing/adapters/RealGeocodingGateway';
import { BookparkingRxListingGateway } from '@front/app/listing/adapters/RealListingGateway';
import { BookparkingRxRentalGateway } from '@front/app/rental/adapters/RealRentalGateway';
import { FetchHttpClient } from '@front/lib/http/FetchHttpClient';
import type { AppState } from '@front/store/AppState';
import { coreReducer } from '@front/store/coreReducer';
import type { Dependencies } from '@front/store/dependencies.interface';
import { rootEpic } from '@front/store/epics';

import { paymentBrowser } from '../adapters/InAppBrowserPaymentPageNavigator';
import { NoThirdPartyConsentStore } from '../adapters/NoThirdPartyConsentStore';
import { SecureStoreSessionStore } from '../adapters/SecureStoreSessionStore';

const INIT: Action = { type: '@@bookparking/init' };

/**
 * La racine de composition de l'app : le même hexagone que le site — mêmes
 * reducers, mêmes epics, mêmes passerelles HTTP — branché sur trois
 * adaptateurs natifs. Seuls changent le magasin de session (le trousseau iOS),
 * la sortie vers Stripe (un navigateur intégré) et le consentement (rien à
 * demander, voir `NoThirdPartyConsentStore`). Toute règle métier vit donc à un
 * seul endroit, `apps/front/src/app`, et se prouve là-bas.
 */
export const buildMobileDependencies = (baseUrl: string): Dependencies => {
  const sessionStore = new SecureStoreSessionStore();
  const httpClient = new FetchHttpClient(baseUrl, () => sessionStore.read()?.token ?? null);

  return {
    accountGateway: new BookparkingRxAccountGateway(httpClient),
    backOfficeGateway: new BookparkingRxBackOfficeGateway(httpClient),
    clock: new SystemClock(),
    consentStore: new NoThirdPartyConsentStore(),
    geocodingGateway: new BanGeocodingGateway(),
    listingGateway: new BookparkingRxListingGateway(httpClient),
    paymentPageNavigator: paymentBrowser,
    rentalGateway: new BookparkingRxRentalGateway(httpClient),
    sessionGateway: new BookparkingRxSessionGateway(httpClient),
    sessionStore,
  };
};

export const createMobileStore = (baseUrl: string) => {
  const dependencies = buildMobileDependencies(baseUrl);

  const epicMiddleware = createEpicMiddleware<Action, Action, AppState, Dependencies>({
    dependencies,
  });

  const stored = dependencies.sessionStore.read();
  const session = isSessionLive(stored, new Date()) ? stored : null;
  if (stored !== null && session === null) dependencies.sessionStore.clear();

  const store = configureStore({
    reducer: { core: coreReducer },
    preloadedState: {
      core: {
        ...coreReducer(undefined, INIT),
        auth: buildInitialAuthState(session),
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false }).concat(epicMiddleware),
  });

  epicMiddleware.run(rootEpic);

  return store;
};

export type MobileStore = ReturnType<typeof createMobileStore>;
