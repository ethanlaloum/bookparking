import { WeakPasswordError } from '../../errors/WeakPasswordError';
import { InvalidPasswordResetTokenError } from './errors/InvalidPasswordResetTokenError';
import { createResetPasswordSUT } from './ResetPassword.sut';

const MARC_ID = '5b0d8a52-6a3e-4f7d-9c1b-2e4f6a8b0c1d';
const LEA_ID = '9e3c1f70-2b4d-4a6e-8f0c-1d3b5a7c9e2f';
const FORMER_PASSWORD = 'Barla2026!';
const NEW_PASSWORD = 'Promenade2027#';
const REQUESTED_AT = new Date('2026-10-01T07:00:00.000Z');
const EXPIRES_AT = new Date('2026-10-01T08:00:00.000Z');
const TOKEN_1_HASH =
  '3f08aace122ee2368432c1ca23a049bc640bafbf00fdf33a52429f38ba12dbf9';
const TOKEN_2_HASH =
  '0f6bffa9661cb5dd2f3f7b2929f33061f58a7ba7fdd689530b1a306f8ed8f3ec';
const LEA_TOKEN_HASH =
  '6b78ac6c8b27d263db61632174ac5f8ab9935e6fcb1f2d771f69068539b9f55d';

const arrangeMarcWithLink = async () => {
  const sut = createResetPasswordSUT();
  await sut.givenAccount({
    id: MARC_ID,
    email: 'marc.d@example.com',
    password: FORMER_PASSWORD,
  });
  await sut.givenResetLink({
    accountId: MARC_ID,
    token: 'token-1',
    requestedAt: REQUESTED_AT,
  });
  return sut;
};

describe('ResetPassword', () => {
  it('replaces the password through a valid link and spends the link', async () => {
    const sut = await arrangeMarcWithLink();
    const resetAt = new Date('2026-10-01T07:20:00.000Z');

    const result = await sut.whenResetting({
      token: 'token-1',
      newPassword: NEW_PASSWORD,
      at: resetAt,
    });

    sut.thenResultIsRight(result);
    await sut.thenPasswordOf(MARC_ID, {
      accepts: NEW_PASSWORD,
      refuses: FORMER_PASSWORD,
    });
    sut.thenResetsAre([
      {
        tokenHash: TOKEN_1_HASH,
        accountId: MARC_ID,
        requestedAt: REQUESTED_AT,
        expiresAt: EXPIRES_AT,
        spentAt: resetAt,
      },
    ]);
  });

  it('spends every other link of the account, and no link of another account', async () => {
    const sut = await arrangeMarcWithLink();
    await sut.givenAccount({
      id: LEA_ID,
      email: 'lea.t@example.com',
      password: FORMER_PASSWORD,
    });
    await sut.givenResetLink({
      accountId: MARC_ID,
      token: 'token-2',
      requestedAt: new Date('2026-10-01T07:05:00.000Z'),
    });
    await sut.givenResetLink({
      accountId: LEA_ID,
      token: 'token-of-lea',
      requestedAt: REQUESTED_AT,
    });
    const resetAt = new Date('2026-10-01T07:10:00.000Z');

    const result = await sut.whenResetting({
      token: 'token-2',
      newPassword: NEW_PASSWORD,
      at: resetAt,
    });

    sut.thenResultIsRight(result);
    sut.thenResetsAre([
      {
        tokenHash: TOKEN_1_HASH,
        accountId: MARC_ID,
        requestedAt: REQUESTED_AT,
        expiresAt: EXPIRES_AT,
        spentAt: resetAt,
      },
      {
        tokenHash: TOKEN_2_HASH,
        accountId: MARC_ID,
        requestedAt: new Date('2026-10-01T07:05:00.000Z'),
        expiresAt: new Date('2026-10-01T08:05:00.000Z'),
        spentAt: resetAt,
      },
      {
        tokenHash: LEA_TOKEN_HASH,
        accountId: LEA_ID,
        requestedAt: REQUESTED_AT,
        expiresAt: EXPIRES_AT,
        spentAt: null,
      },
    ]);
  });

  it('refuses an unknown link and keeps the password', async () => {
    const sut = await arrangeMarcWithLink();

    const result = await sut.whenResetting({
      token: 'token-inconnu',
      newPassword: NEW_PASSWORD,
      at: new Date('2026-10-01T07:20:00.000Z'),
    });

    sut.thenResultIsLeftWith(result, new InvalidPasswordResetTokenError());
    await sut.thenPasswordOf(MARC_ID, {
      accepts: FORMER_PASSWORD,
      refuses: NEW_PASSWORD,
    });
  });

  it('refuses a link at the very instant it expires', async () => {
    const sut = await arrangeMarcWithLink();

    const result = await sut.whenResetting({
      token: 'token-1',
      newPassword: NEW_PASSWORD,
      at: EXPIRES_AT,
    });

    sut.thenResultIsLeftWith(result, new InvalidPasswordResetTokenError());
    await sut.thenPasswordOf(MARC_ID, {
      accepts: FORMER_PASSWORD,
      refuses: NEW_PASSWORD,
    });
    sut.thenResetsAre([
      {
        tokenHash: TOKEN_1_HASH,
        accountId: MARC_ID,
        requestedAt: REQUESTED_AT,
        expiresAt: EXPIRES_AT,
        spentAt: null,
      },
    ]);
  });

  it('accepts a link one millisecond before it expires', async () => {
    const sut = await arrangeMarcWithLink();

    const result = await sut.whenResetting({
      token: 'token-1',
      newPassword: NEW_PASSWORD,
      at: new Date('2026-10-01T07:59:59.999Z'),
    });

    sut.thenResultIsRight(result);
    await sut.thenPasswordOf(MARC_ID, {
      accepts: NEW_PASSWORD,
      refuses: FORMER_PASSWORD,
    });
  });

  it('refuses a link that has already been used', async () => {
    const sut = await arrangeMarcWithLink();
    await sut.whenResetting({
      token: 'token-1',
      newPassword: NEW_PASSWORD,
      at: new Date('2026-10-01T07:20:00.000Z'),
    });

    const second = await sut.whenResetting({
      token: 'token-1',
      newPassword: 'Autre2027!Mot',
      at: new Date('2026-10-01T07:21:00.000Z'),
    });

    sut.thenResultIsLeftWith(second, new InvalidPasswordResetTokenError());
    await sut.thenPasswordOf(MARC_ID, {
      accepts: NEW_PASSWORD,
      refuses: 'Autre2027!Mot',
    });
  });

  it('refuses a weak password and leaves the link usable', async () => {
    const sut = await arrangeMarcWithLink();

    const weak = await sut.whenResetting({
      token: 'token-1',
      newPassword: 'motdepasse',
      at: new Date('2026-10-01T07:20:00.000Z'),
    });
    const retried = await sut.whenResetting({
      token: 'token-1',
      newPassword: NEW_PASSWORD,
      at: new Date('2026-10-01T07:21:00.000Z'),
    });

    sut.thenResultIsLeftWith(weak, new WeakPasswordError('WEAK'));
    sut.thenResultIsRight(retried);
    await sut.thenPasswordOf(MARC_ID, {
      accepts: NEW_PASSWORD,
      refuses: 'motdepasse',
    });
  });
});
