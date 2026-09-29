export interface SchemaAccountRepository {
  id: string;
  email: string;
  password_hash: string;
  registered_at: Date | string;
  suspended_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}
