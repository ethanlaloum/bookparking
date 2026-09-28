export interface SchemaPasswordResetRepository {
  token_hash: string;
  account_id: string;
  requested_at: Date | string;
  expires_at: Date | string;
  spent_at: Date | string | null;
}
