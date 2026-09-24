// SPEC-007 RG-02. Recopiée à la lettre dans le site
// (`apps/front/src/app/account/domain/entities/Password.ts`), qui doit juger
// exactement pareil : faire évoluer l'une sans l'autre, et le site accepterait
// ce que l'api refuse. EX-08 les confronte.
export type PasswordStrength = 'TOO_SHORT' | 'WEAK' | 'MEDIUM' | 'STRONG';

export const MINIMUM_PASSWORD_LENGTH = 8;

// Faibles quoi qu'ils comptent. Comparés en minuscules.
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

const KINDS_OF_CHARACTERS = [
  /\p{Ll}/u,
  /\p{Lu}/u,
  /\p{Nd}/u,
  /[^\p{Ll}\p{Lu}\p{Nd}]/u,
];

// La longueur est celle de `String.length`, comme la borne de 8 caractères de
// `RegisterAccountSchema` : un émoji compte pour deux.
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
