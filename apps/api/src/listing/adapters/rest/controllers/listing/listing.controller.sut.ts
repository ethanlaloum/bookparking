import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { ListingBuilder } from '../../../../domain/builders/ListingBuilder';
import { ListingStatus } from '../../../../domain/entities/Listing';
import { GetListing } from '../../../../domain/usecases/get-listing/GetListing';
import { ListingNotFoundError } from '../../../../domain/usecases/get-listing/errors/ListingNotFoundError';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { ListingController } from './listing.controller';

export const MARC_ACCOUNT_ID = 'account-marc';

interface ListingFixture {
  id: string;
  address: string;
  box: string;
}

export const createListingControllerSUT = () => {
  const publishListing = new UseCaseDouble();
  const getListing = new UseCaseDouble();
  const authState: TestAuthState = { user: { id: MARC_ACCOUNT_ID } };

  const metadata: ModuleMetadata = {
    controllers: [ListingController],
    providers: [
      { provide: PublishListing, useValue: publishListing },
      { provide: GetListing, useValue: getListing },
    ],
  };

  return {
    metadata,
    publishListing,
    getListing,
    authState,

    givenActiveListing(fixture: ListingFixture) {
      const listing = new ListingBuilder()
        .withId(fixture.id)
        .withOwnerId(MARC_ACCOUNT_ID)
        .withAddress(fixture.address)
        .withBox(fixture.box)
        .withStatus(ListingStatus.ACTIVE)
        .build();

      getListing.willResolve(Either.right(listing));
      return { listing };
    },

    givenUnpublishedListing(fixture: ListingFixture) {
      const listing = new ListingBuilder()
        .withId(fixture.id)
        .withOwnerId(MARC_ACCOUNT_ID)
        .withAddress(fixture.address)
        .withBox(fixture.box)
        .withStatus(ListingStatus.UNPUBLISHED)
        .build();

      getListing.willResolve(Either.left(new ListingNotFoundError()));
      return { listing };
    },
  };
};
