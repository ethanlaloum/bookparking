import { ModuleMetadata } from '@nestjs/common';

import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { ListingController } from './listing.controller';

export const MARC_ACCOUNT_ID = 'account-marc';

export const createListingControllerSUT = () => {
  const publishListing = new UseCaseDouble();
  const authState: TestAuthState = { user: { id: MARC_ACCOUNT_ID } };

  const metadata: ModuleMetadata = {
    controllers: [ListingController],
    providers: [{ provide: PublishListing, useValue: publishListing }],
  };

  return { metadata, publishListing, authState };
};
