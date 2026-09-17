export interface SchemaListingRepository {
  id: string;
  owner_id: string;
  address: string;
  box: string;
  place_key?: string;
  access_description: string;
  photos: string[];
  day_price_in_cents: number;
  week_price_in_cents: number;
  month_price_in_cents: number;
  available_from: Date | string;
  available_to: Date | string;
  status: string;
  published_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}
