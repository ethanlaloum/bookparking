import { BookparkingRxAccountGateway } from '../app/account/adapters/RealAccountGateway';
import { LocalStorageSessionStore } from '../app/auth/adapters/LocalStorageSessionStore';
import { BookparkingRxSessionGateway } from '../app/auth/adapters/RealSessionGateway';
import { BookparkingRxBackOfficeGateway } from '../app/back-office/adapters/RealBackOfficeGateway';
import { LocalStorageConsentStore } from '../app/consent/adapters/LocalStorageConsentStore';
import { SystemClock } from '../app/consent/adapters/SystemClock';
import { BanGeocodingGateway } from '../app/listing/adapters/RealGeocodingGateway';
import { BookparkingRxListingGateway } from '../app/listing/adapters/RealListingGateway';
import { BookparkingRxRentalGateway } from '../app/rental/adapters/RealRentalGateway';
import { FetchHttpClient } from '../lib/http/FetchHttpClient';
import type { Dependencies } from './dependencies.interface';

export const buildDependencies = (baseUrl: string): Dependencies => {
  const sessionStore = new LocalStorageSessionStore();
  const httpClient = new FetchHttpClient(baseUrl, () => sessionStore.read()?.token ?? null);

  return {
    accountGateway: new BookparkingRxAccountGateway(httpClient),
    backOfficeGateway: new BookparkingRxBackOfficeGateway(httpClient),
    clock: new SystemClock(),
    consentStore: new LocalStorageConsentStore(),
    geocodingGateway: new BanGeocodingGateway(),
    listingGateway: new BookparkingRxListingGateway(httpClient),
    rentalGateway: new BookparkingRxRentalGateway(httpClient),
    sessionGateway: new BookparkingRxSessionGateway(httpClient),
    sessionStore,
  };
};
