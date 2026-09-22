import { Listing } from '../../domain/entities/Listing';
import { GetListingResponseDto } from '../rest/dtos/GetListingResponseDto';
import { GetOwnerListingResponseDto } from '../rest/dtos/GetOwnerListingResponseDto';

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

  public static toGetOwnerListingDto(
    listing: Listing,
  ): GetOwnerListingResponseDto {
    const state = listing.toState();

    return {
      ...ListingMapper.toGetListingDto(listing),
      status: state.status,
    };
  }
}
