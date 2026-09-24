import { Avatar } from '../../../domain/entities/Account';

export interface SchemaAccountRepository {
  id: string;
  email: string;
  password_hash: string;
  registered_at: Date | string;
  terms_accepted_at: Date | string | null;
  avatar: Avatar;
  suspended_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}
