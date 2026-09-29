import { describe, expect, it } from 'vitest';

import { passwordGaugeOf, passwordStrengthOf, passwordsMatch } from './Password';

// Les mots de passe et les niveaux de l'api, EX-02 à EX-07
// (`apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts`).
const RATED_BY_THE_API = [
  ['boxparking7', 'WEAK'],
  ['Azerty123', 'WEAK'],
  ['motdepasse12', 'MEDIUM'],
  ['Barla2026!', 'STRONG'],
  ['Barl26!', 'TOO_SHORT'],
  ['é'.repeat(66) + 'ü'.repeat(67) + '🚗'.repeat(67), 'STRONG'],
] as const;

describe('Password @SPEC-007', () => {
  it('refuses a confirmation that differs from the password @EX-007-01', () => {
    expect(passwordsMatch('Barla2026!', 'Barla2062!')).toBe(false);
    expect(passwordsMatch('Barla2026!', 'Barla2026!')).toBe(true);
  });

  it('rates every password exactly as the api does @EX-007-08', () => {
    expect(RATED_BY_THE_API.map(([password]) => passwordStrengthOf(password))).toEqual(
      RATED_BY_THE_API.map(([, strength]) => strength),
    );
  });

  it('fills the gauge from red to orange to green @EX-007-09', () => {
    expect(
      (['TOO_SHORT', 'WEAK', 'MEDIUM', 'STRONG'] as const).map((strength) =>
        passwordGaugeOf(strength),
      ),
    ).toEqual([
      { segments: 1, tone: 'danger' },
      { segments: 1, tone: 'danger' },
      { segments: 2, tone: 'warn' },
      { segments: 3, tone: 'ok' },
    ]);
  });
});
