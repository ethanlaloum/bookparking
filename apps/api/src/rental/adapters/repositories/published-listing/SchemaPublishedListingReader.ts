export const LISTINGS_TABLE = 'listings';

// The listing context owns this table; the rental context is only allowed to read
// it, never to import from it, so the status value and the column list are copied
// here on purpose. A change to the listing status vocabulary does not reach this
// file by itself — the adapters below keep reading the old value until edited.
export const ACTIVE_LISTING_STATUS = 'ACTIVE';

export interface SchemaPublishedListingReader {
  id: string;
  owner_id: string;
  address: string;
  box: string;
  place_key: string;
  day_price_in_cents: number | string | null;
  week_price_in_cents: number | string | null;
  month_price_in_cents: number | string | null;
  status: string;
}
