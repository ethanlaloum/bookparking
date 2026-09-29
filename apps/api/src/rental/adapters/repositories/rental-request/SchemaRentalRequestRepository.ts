export enum RentalRequestStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
}

export interface SchemaRentalRequestRepository {
  id: string;
  listing_id: string;
  renter_id: string;
  place_key: string;
  from_day: string;
  to_day: string;
  period_from: Date | string;
  period_to: Date | string;
  price_in_cents: number | string;
  status: string;
  requested_at: Date | string;
  confirmed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}
