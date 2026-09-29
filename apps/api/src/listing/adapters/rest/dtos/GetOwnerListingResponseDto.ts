export interface GetOwnerListingResponseDto {
  id: string;
  address: string;
  box: string;
  status: string;
  accessDescription: string;
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
