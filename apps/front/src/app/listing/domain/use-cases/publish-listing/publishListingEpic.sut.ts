import { expect } from 'vitest';

import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import {
  selectPublishError,
  selectPublishSuccess,
} from '../../../../../selectors/listing/listingSelectors';
import type { LocalPhoto, PublishListingDraft } from '../../entities/ListingPhoto';
import type { PublishListingPayload } from '../../ports/ListingGateway';
import { publishListingRequested } from './publishListingEpic';

export const createPublishListingSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRejectsWith(message: string): void {
      dependencies.listingGateway.rejection = message;
    },
    givenThePhotoUploadsAreRefusedWith(message: string): void {
      dependencies.listingGateway.uploadRejection = message;
    },
    whenPublishing(draft: PublishListingDraft): void {
      store.dispatch(publishListingRequested(draft));
    },
    thenTheUploadedPhotosAre(expected: LocalPhoto[]): void {
      expect(dependencies.listingGateway.uploadedPhotos).toEqual(expected);
    },
    thenThePublishedListingsAre(expected: PublishListingPayload[]): void {
      expect(dependencies.listingGateway.published).toEqual(expected);
    },
    thenThePublicationSucceeded(): void {
      if (!selectPublishSuccess(store.getState()))
        throw new Error('La publication n est pas marquee comme reussie');
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectPublishError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
    thenTheListingsWereRefetched(times: number): void {
      const actual = dependencies.listingGateway.listCallCount;
      if (actual !== times) throw new Error(`Relectures attendues ${times}, obtenues ${actual}`);
    },
  };
};
