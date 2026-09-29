import { getListingEpic } from '../../app/listing/domain/use-cases/get-listing/getListingEpic';
import { listListingsEpic } from '../../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { listOwnerListingsEpic } from '../../app/listing/domain/use-cases/list-owner-listings/listOwnerListingsEpic';
import { locateListingsEpic } from '../../app/listing/domain/use-cases/locate-listings/locateListingsEpic';
import { searchAddressEpic } from '../../app/listing/domain/use-cases/search-address/searchAddressEpic';
import { searchFreeListingsEpic } from '../../app/listing/domain/use-cases/search-free-listings/searchFreeListingsEpic';
import { publishListingEpic } from '../../app/listing/domain/use-cases/publish-listing/publishListingEpic';
import { unpublishListingEpic } from '../../app/listing/domain/use-cases/unpublish-listing/unpublishListingEpic';
import { editListingEpic } from '../../app/listing/domain/use-cases/edit-listing/editListingEpic';

export const listingEpics = [
  listListingsEpic,
  listOwnerListingsEpic,
  locateListingsEpic,
  searchAddressEpic,
  searchFreeListingsEpic,
  getListingEpic,
  publishListingEpic,
  unpublishListingEpic,
  editListingEpic,
];
