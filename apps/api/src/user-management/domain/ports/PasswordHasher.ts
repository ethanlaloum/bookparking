export interface PasswordHasher {
  hash(plainTextPassword: string): string;
  verify(plainTextPassword: string, storedPassword: string): boolean;
}
