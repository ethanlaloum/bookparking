import { ModuleMetadata } from '@nestjs/common';

import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { ListingController } from './listing.controller';

export const createListingControllerSUT = () => {
  const publishListing = new UseCaseDouble();

  const metadata: ModuleMetadata = {
    controllers: [ListingController],
    providers: [{ provide: PublishListing, useValue: publishListing }],
  };

  return { metadata, publishListing };
};
