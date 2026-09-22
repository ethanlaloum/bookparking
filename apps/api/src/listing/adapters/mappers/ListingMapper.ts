import { Listing } from '../../domain/entities/Listing';
import { ListedActiveListings } from '../../domain/usecases/list-active-listings/ListActiveListings';
import { GetListingResponseDto } from '../rest/dtos/GetListingResponseDto';
import { ListListingsResponseDto } from '../rest/dtos/ListListingsResponseDto';

export class ListingMapper {
  public static toGetListingDto(listing: Listing): GetListingResponseDto {
    const state = listing.toState();

    return {
      id: state.id,
      address: state.address,
      box: state.box,
      photos: [...state.photos],
      pricing: {
        dayInCents: state.pricing.dayInCents,
        weekInCents: state.pricing.weekInCents,
        monthInCents: state.pricing.monthInCents,
      },
      availability: {
        from: state.availability.from.toISOString(),
        to: state.availability.to.toISOString(),
      },
    };
  }

  public static toListListingsDto(
    listed: ListedActiveListings,
  ): ListListingsResponseDto {
    return {
      listings: listed.listings.map((listing) =>
        ListingMapper.toGetListingDto(listing),
      ),
      total: listed.total,
      page: listed.page,
      size: listed.size,
    };
  }
}
