import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexPasswordResetRepositorySUT } from './KnexPasswordResetRepository.sut';

const MARC_ID = '5b0d8a52-6a3e-4f7d-9c1b-2e4f6a8b0c1d';
const LEA_ID = '9e3c1f70-2b4d-4a6e-8f0c-1d3b5a7c9e2f';
const TOKEN_1_HASH =
  '3f08aace122ee2368432c1ca23a049bc640bafbf00fdf33a52429f38ba12dbf9';
const TOKEN_2_HASH =
  '0f6bffa9661cb5dd2f3f7b2929f33061f58a7ba7fdd689530b1a306f8ed8f3ec';
const LEA_TOKEN_HASH =
  '6b78ac6c8b27d263db61632174ac5f8ab9935e6fcb1f2d771f69068539b9f55d';

describe('KnexPasswordResetRepository', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('writes a reset as the hash of its token, never the token', async () => {
    const sut = createKnexPasswordResetRepositorySUT();
    await sut.givenAccount(MARC_ID, 'marc.d@example.com');

    await sut.givenReset({
      accountId: MARC_ID,
      token: 'token-1',
      requestedAt: '2026-10-01T07:00:00.000Z',
    });

    await sut.thenRowsAre([
      {
        token_hash: TOKEN_1_HASH,
        account_id: MARC_ID,
        requested_at: new Date('2026-10-01T07:00:00.000Z'),
        expires_at: new Date('2026-10-01T08:00:00.000Z'),
        spent_at: null,
      },
    ]);
    await sut.thenNoRowHolds('token-1');
  });

  it('reads a reset back by the hash of its token', async () => {
    const sut = createKnexPasswordResetRepositorySUT();
    await sut.givenAccount(MARC_ID, 'marc.d@example.com');
    await sut.givenReset({
      accountId: MARC_ID,
      token: 'token-1',
      requestedAt: '2026-10-01T07:00:00.000Z',
    });

    const found = await sut.whenReadingByToken('token-1');
    const unknown = await sut.whenReadingByToken('token-inconnu');

    sut.thenResetIs(found, {
      tokenHash: TOKEN_1_HASH,
      accountId: MARC_ID,
      requestedAt: new Date('2026-10-01T07:00:00.000Z'),
      expiresAt: new Date('2026-10-01T08:00:00.000Z'),
      spentAt: null,
    });
    sut.thenResetIs(unknown, null);
  });

  it('reads the latest reset of one account only', async () => {
    const sut = createKnexPasswordResetRepositorySUT();
    await sut.givenAccount(MARC_ID, 'marc.d@example.com');
    await sut.givenAccount(LEA_ID, 'lea.t@example.com');
    await sut.givenReset({
      accountId: MARC_ID,
      token: 'token-1',
      requestedAt: '2026-10-01T07:00:00.000Z',
    });
    await sut.givenReset({
      accountId: MARC_ID,
      token: 'token-2',
      requestedAt: '2026-10-01T07:05:00.000Z',
    });
    await sut.givenReset({
      accountId: LEA_ID,
      token: 'token-of-lea',
      requestedAt: '2026-10-01T07:10:00.000Z',
    });

    const latest = await sut.whenReadingLatestOf(MARC_ID);

    sut.thenResetIs(latest, {
      tokenHash: TOKEN_2_HASH,
      accountId: MARC_ID,
      requestedAt: new Date('2026-10-01T07:05:00.000Z'),
      expiresAt: new Date('2026-10-01T08:05:00.000Z'),
      spentAt: null,
    });
  });

  it('spends the unspent resets of one account, and only once', async () => {
    const sut = createKnexPasswordResetRepositorySUT();
    await sut.givenAccount(MARC_ID, 'marc.d@example.com');
    await sut.givenAccount(LEA_ID, 'lea.t@example.com');
    await sut.givenReset({
      accountId: MARC_ID,
      token: 'token-1',
      requestedAt: '2026-10-01T07:00:00.000Z',
      spentAt: '2026-10-01T07:01:00.000Z',
    });
    await sut.givenReset({
      accountId: MARC_ID,
      token: 'token-2',
      requestedAt: '2026-10-01T07:05:00.000Z',
    });
    await sut.givenReset({
      accountId: LEA_ID,
      token: 'token-of-lea',
      requestedAt: '2026-10-01T07:10:00.000Z',
    });

    const first = await sut.whenSpendingUnspentOf(
      MARC_ID,
      '2026-10-01T07:20:00.000Z',
    );
    const second = await sut.whenSpendingUnspentOf(
      MARC_ID,
      '2026-10-01T07:21:00.000Z',
    );

    sut.thenSpentHashesAre([first, second], [[TOKEN_2_HASH], []]);
    await sut.thenRowsAre([
      {
        token_hash: TOKEN_1_HASH,
        account_id: MARC_ID,
        requested_at: new Date('2026-10-01T07:00:00.000Z'),
        expires_at: new Date('2026-10-01T08:00:00.000Z'),
        spent_at: new Date('2026-10-01T07:01:00.000Z'),
      },
      {
        token_hash: TOKEN_2_HASH,
        account_id: MARC_ID,
        requested_at: new Date('2026-10-01T07:05:00.000Z'),
        expires_at: new Date('2026-10-01T08:05:00.000Z'),
        spent_at: new Date('2026-10-01T07:20:00.000Z'),
      },
      {
        token_hash: LEA_TOKEN_HASH,
        account_id: LEA_ID,
        requested_at: new Date('2026-10-01T07:10:00.000Z'),
        expires_at: new Date('2026-10-01T08:10:00.000Z'),
        spent_at: null,
      },
    ]);
  });

  it('removes the resets of an account with the account', async () => {
    const sut = createKnexPasswordResetRepositorySUT();
    await sut.givenAccount(MARC_ID, 'marc.d@example.com');
    await sut.givenReset({
      accountId: MARC_ID,
      token: 'token-1',
      requestedAt: '2026-10-01T07:00:00.000Z',
    });

    await sut.thenRowsAreGoneWithTheAccount(MARC_ID);
  });
});
