export interface GetRentalRequestResponseDto {
  id: string;
  listingId: string;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  status: string;
  requestedAt: string;
  confirmedAt: string | null;
}
