import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { PasswordHasher } from '../../../domain/ports/PasswordHasher';

const ALGORITHM = 'scrypt';
const FIELD_SEPARATOR = '$';
const SALT_BYTES = 16;
const DERIVED_KEY_BYTES = 64;

const deriveKey = (plainTextPassword: string, salt: Buffer): Buffer =>
  scryptSync(plainTextPassword.normalize('NFC'), salt, DERIVED_KEY_BYTES);

export class ScryptPasswordHasher implements PasswordHasher {
  public hash(plainTextPassword: string): string {
    const salt = randomBytes(SALT_BYTES);
    return [
      ALGORITHM,
      salt.toString('base64'),
      deriveKey(plainTextPassword, salt).toString('base64'),
    ].join(FIELD_SEPARATOR);
  }

  public verify(plainTextPassword: string, storedPassword: string): boolean {
    const [algorithm, encodedSalt, encodedKey] =
      storedPassword.split(FIELD_SEPARATOR);
    if (algorithm !== ALGORITHM || !encodedSalt || !encodedKey) return false;

    const storedKey = Buffer.from(encodedKey, 'base64');
    const candidateKey = deriveKey(
      plainTextPassword,
      Buffer.from(encodedSalt, 'base64'),
    );
    return (
      storedKey.length === candidateKey.length &&
      timingSafeEqual(storedKey, candidateKey)
    );
  }
}
