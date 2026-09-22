import { getListingEpic } from '../../app/listing/domain/use-cases/get-listing/getListingEpic';
import { listListingsEpic } from '../../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { listOwnerListingsEpic } from '../../app/listing/domain/use-cases/list-owner-listings/listOwnerListingsEpic';
import { locateListingsEpic } from '../../app/listing/domain/use-cases/locate-listings/locateListingsEpic';
import { publishListingEpic } from '../../app/listing/domain/use-cases/publish-listing/publishListingEpic';
import { unpublishListingEpic } from '../../app/listing/domain/use-cases/unpublish-listing/unpublishListingEpic';
import { updateListingPricingEpic } from '../../app/listing/domain/use-cases/update-listing-pricing/updateListingPricingEpic';

export const listingEpics = [
  listListingsEpic,
  listOwnerListingsEpic,
  locateListingsEpic,
  getListingEpic,
  publishListingEpic,
  unpublishListingEpic,
  updateListingPricingEpic,
];
