export interface GetListingResponseDto {
  id: string;
  address: string;
  box: string;
  photos: string[];
  acceptedVehicles: string[];
  pricing: {
    dayInCents: number | null;
    weekInCents: number | null;
    monthInCents: number | null;
  };
  availability: {
    from: string;
    to: string;
  };
}
