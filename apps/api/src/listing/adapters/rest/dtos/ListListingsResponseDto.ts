import { GetListingResponseDto } from './GetListingResponseDto';

export interface ListListingsResponseDto {
  listings: GetListingResponseDto[];
  total: number;
  page: number;
  size: number;
}
