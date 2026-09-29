import { PasswordStrength } from '../services/passwordStrength';

// Partagée par l'inscription et le changement de mot de passe (SPEC-007 RG-02).
// Le message ne cite jamais le mot de passe.
export class WeakPasswordError extends Error {
  protected readonly _tag = 'WeakPasswordError';
  constructor(
    strength: Extract<PasswordStrength, 'TOO_SHORT' | 'WEAK'> = 'TOO_SHORT',
  ) {
    super(
      strength === 'TOO_SHORT'
        ? 'Le mot de passe doit contenir au moins 8 caractères'
        : 'Ce mot de passe est trop faible : allongez-le, ou mêlez minuscules, majuscules, chiffres et symboles',
    );
  }
}
