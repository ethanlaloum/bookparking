import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { createRequestPasswordResetSUT } from './RequestPasswordReset.sut';

const MARC_ID = '5b0d8a52-6a3e-4f7d-9c1b-2e4f6a8b0c1d';
const MARC_EMAIL = 'marc.d@example.com';
const REQUESTED_AT = new Date('2026-10-01T07:00:00.000Z');
const TOKEN_1_HASH =
  '3f08aace122ee2368432c1ca23a049bc640bafbf00fdf33a52429f38ba12dbf9';
const TOKEN_2_HASH =
  '0f6bffa9661cb5dd2f3f7b2929f33061f58a7ba7fdd689530b1a306f8ed8f3ec';

const resetEmail = (token: string, queuedAt: Date) => ({
  kind: 'PASSWORD_RESET',
  recipient: MARC_EMAIL,
  status: 'PENDING',
  attempts: 0,
  queuedAt,
  sentAt: null,
  failedAt: null,
  passwordResetToken: token,
});

describe('RequestPasswordReset', () => {
  it('stores the hash of a one-hour link and queues the email that carries it', async () => {
    const sut = createRequestPasswordResetSUT();
    await sut.givenAccount({ id: MARC_ID, email: MARC_EMAIL });

    const result = await sut.whenRequestingReset(
      ' Marc.D@Example.com ',
      REQUESTED_AT,
    );

    sut.thenResultIsRight(result);
    sut.thenResetsAre([
      {
        tokenHash: TOKEN_1_HASH,
        accountId: MARC_ID,
        requestedAt: REQUESTED_AT,
        expiresAt: new Date('2026-10-01T08:00:00.000Z'),
        spentAt: null,
      },
    ]);
    sut.thenQueuedEmailsAre([resetEmail('token-1', REQUESTED_AT)]);
  });

  it('answers the same for an unknown address, and queues nothing', async () => {
    const sut = createRequestPasswordResetSUT();
    await sut.givenAccount({ id: MARC_ID, email: MARC_EMAIL });

    const result = await sut.whenRequestingReset(
      'inconnu@example.com',
      REQUESTED_AT,
    );

    sut.thenResultIsRight(result);
    sut.thenResetsAre([]);
    sut.thenQueuedEmailsAre([]);
  });

  it('queues nothing for a suspended account', async () => {
    const sut = createRequestPasswordResetSUT();
    await sut.givenAccount({
      id: MARC_ID,
      email: MARC_EMAIL,
      suspendedAt: new Date('2026-09-15T00:00:00.000Z'),
    });

    const result = await sut.whenRequestingReset(MARC_EMAIL, REQUESTED_AT);

    sut.thenResultIsRight(result);
    sut.thenResetsAre([]);
    sut.thenQueuedEmailsAre([]);
  });

  it('queues no second link within two minutes of the first', async () => {
    const sut = createRequestPasswordResetSUT();
    await sut.givenAccount({ id: MARC_ID, email: MARC_EMAIL });

    await sut.whenRequestingReset(MARC_EMAIL, REQUESTED_AT);
    const second = await sut.whenRequestingReset(
      MARC_EMAIL,
      new Date('2026-10-01T07:01:59.999Z'),
    );

    sut.thenResultIsRight(second);
    sut.thenResetsAre([
      {
        tokenHash: TOKEN_1_HASH,
        accountId: MARC_ID,
        requestedAt: REQUESTED_AT,
        expiresAt: new Date('2026-10-01T08:00:00.000Z'),
        spentAt: null,
      },
    ]);
    sut.thenQueuedEmailsAre([resetEmail('token-1', REQUESTED_AT)]);
  });

  it('queues a second link once two minutes have passed', async () => {
    const sut = createRequestPasswordResetSUT();
    await sut.givenAccount({ id: MARC_ID, email: MARC_EMAIL });
    const secondAt = new Date('2026-10-01T07:02:00.000Z');

    await sut.whenRequestingReset(MARC_EMAIL, REQUESTED_AT);
    const second = await sut.whenRequestingReset(MARC_EMAIL, secondAt);

    sut.thenResultIsRight(second);
    sut.thenResetsAre([
      {
        tokenHash: TOKEN_1_HASH,
        accountId: MARC_ID,
        requestedAt: REQUESTED_AT,
        expiresAt: new Date('2026-10-01T08:00:00.000Z'),
        spentAt: null,
      },
      {
        tokenHash: TOKEN_2_HASH,
        accountId: MARC_ID,
        requestedAt: secondAt,
        expiresAt: new Date('2026-10-01T08:02:00.000Z'),
        spentAt: null,
      },
    ]);
    sut.thenQueuedEmailsAre([
      resetEmail('token-1', REQUESTED_AT),
      resetEmail('token-2', secondAt),
    ]);
  });

  it('reports an outbox that cannot be written to', async () => {
    const sut = createRequestPasswordResetSUT();
    await sut.givenAccount({ id: MARC_ID, email: MARC_EMAIL });
    sut.givenOutboxIsUnreachable();

    const result = await sut.whenRequestingReset(MARC_EMAIL, REQUESTED_AT);

    sut.thenResultIsLeftWith(
      result,
      new UnknownError('email outbox is unreachable'),
    );
  });
});
