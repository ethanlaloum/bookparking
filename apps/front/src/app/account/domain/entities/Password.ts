/**
 * SPEC-007 RG-02, recopiée à la lettre de l'api
 * (`apps/api/src/user-management/domain/services/passwordStrength.ts`) : le
 * site doit refuser exactement ce que l'api refuse, ni plus ni moins. Faire
 * évoluer l'une sans l'autre, et `Password.unit.spec.ts` (EX-08) le dira.
 */
export type PasswordStrength = 'TOO_SHORT' | 'WEAK' | 'MEDIUM' | 'STRONG';

export const MINIMUM_PASSWORD_LENGTH = 8;

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'azerty12',
  'azerty123',
  'azerty1234',
  'azertyuiop',
  'bonjour123',
  'bookparking',
  'bookparking1',
  'iloveyou',
  'jetaime123',
  'marseille13',
  'motdepasse',
  'motdepasse1',
  'motdepasse123',
  'parking123',
  'password',
  'password1',
  'password123',
  'password1!',
  'qwerty123',
  'qwertyuiop',
  'soleil123',
]);

const KINDS_OF_CHARACTERS = [/\p{Ll}/u, /\p{Lu}/u, /\p{Nd}/u, /[^\p{Ll}\p{Lu}\p{Nd}]/u];

export const passwordStrengthOf = (password: string): PasswordStrength => {
  if (password.length < MINIMUM_PASSWORD_LENGTH) return 'TOO_SHORT';
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 'WEAK';
  const points =
    KINDS_OF_CHARACTERS.filter((kind) => kind.test(password)).length +
    (password.length >= 12 ? 1 : 0) +
    (password.length >= 16 ? 1 : 0);
  if (points <= 2) return 'WEAK';
  if (points === 3) return 'MEDIUM';
  return 'STRONG';
};

export const isStrongEnough = (password: string): boolean => {
  const strength = passwordStrengthOf(password);
  return strength === 'MEDIUM' || strength === 'STRONG';
};

export const passwordsMatch = (password: string, confirmation: string): boolean =>
  password === confirmation;

export interface PasswordGauge {
  segments: 1 | 2 | 3;
  tone: 'danger' | 'warn' | 'ok';
}

const GAUGES: Record<PasswordStrength, PasswordGauge> = {
  TOO_SHORT: { segments: 1, tone: 'danger' },
  WEAK: { segments: 1, tone: 'danger' },
  MEDIUM: { segments: 2, tone: 'warn' },
  STRONG: { segments: 3, tone: 'ok' },
};

export const passwordGaugeOf = (strength: PasswordStrength): PasswordGauge => GAUGES[strength];
