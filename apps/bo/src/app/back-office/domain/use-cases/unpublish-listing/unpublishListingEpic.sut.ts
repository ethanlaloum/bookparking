import { createModerationSut } from '../../../../../store/testing/createModerationSut';
import { unpublishListingRequested } from './unpublishListingEpic';

export const createUnpublishListingSut = () =>
  createModerationSut(unpublishListingRequested, (gateway) => gateway.listListingsCallCount);
