export enum RentalRequestStatus {
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  ABANDONED = 'ABANDONED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
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
  money_status: string;
  checkout_session_id: string | null;
  payment_id: string | null;
  hold_placed_at: Date | string | null;
  refund_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}
