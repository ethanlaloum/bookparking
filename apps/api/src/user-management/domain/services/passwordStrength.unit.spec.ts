import { isStrongEnough, passwordStrengthOf } from './passwordStrength';

const LONG_PASSWORD_WITH_ACCENTS_AND_EMOJI =
  'é'.repeat(66) + 'ü'.repeat(67) + '🚗'.repeat(67);

describe('passwordStrength @SPEC-007', () => {
  it('rates two kinds under twelve characters as weak @EX-007-02', () => {
    expect(passwordStrengthOf('boxparking7')).toEqual('WEAK');
    expect(isStrongEnough('boxparking7')).toEqual(false);
  });

  it('rates a common password as weak whatever it counts @EX-007-03', () => {
    expect(passwordStrengthOf('Azerty123')).toEqual('WEAK');
  });

  it('rates two kinds and twelve characters as medium and accepts it @EX-007-04', () => {
    expect(passwordStrengthOf('motdepasse12')).toEqual('MEDIUM');
    expect(isStrongEnough('motdepasse12')).toEqual(true);
  });

  it('rates four kinds as strong @EX-007-05', () => {
    expect(passwordStrengthOf('Barla2026!')).toEqual('STRONG');
  });

  it('rates seven varied characters as too short @EX-007-06', () => {
    expect(passwordStrengthOf('Barl26!')).toEqual('TOO_SHORT');
    expect(isStrongEnough('Barl26!')).toEqual(false);
  });

  it('rates a long accented password with emoji as strong @EX-007-07', () => {
    expect(passwordStrengthOf(LONG_PASSWORD_WITH_ACCENTS_AND_EMOJI)).toEqual(
      'STRONG',
    );
  });
});
