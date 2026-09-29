import { LocalStorageSessionStore } from '@front/app/auth/adapters/LocalStorageSessionStore';
import { BookparkingRxSessionGateway } from '@front/app/auth/adapters/RealSessionGateway';
import { FetchHttpClient } from '@front/lib/http/FetchHttpClient';

import { BookparkingRxBackOfficeGateway } from '../app/back-office/adapters/RealBackOfficeGateway';
import type { Dependencies } from './dependencies.interface';

export const buildDependencies = (baseUrl: string): Dependencies => {
  const sessionStore = new LocalStorageSessionStore();
  const httpClient = new FetchHttpClient(baseUrl, () => sessionStore.read()?.token ?? null);

  return {
    backOfficeGateway: new BookparkingRxBackOfficeGateway(httpClient),
    sessionGateway: new BookparkingRxSessionGateway(httpClient),
    sessionStore,
  };
};
