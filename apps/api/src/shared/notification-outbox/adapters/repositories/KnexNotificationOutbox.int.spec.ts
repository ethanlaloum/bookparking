import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexNotificationOutboxSUT } from './KnexNotificationOutbox.sut';

const MARC_EMAIL = 'marc.d@example.com';

describe('KnexNotificationOutbox', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('writes the notification and queues its email to the address of the account', async () => {
    const sut = createKnexNotificationOutboxSUT();
    const marc = await sut.givenAccount(MARC_EMAIL);
    const requestId = await sut.givenRequestOnMarcPlace(marc, 'account-lea');

    await sut.whenNotifying(requestId, marc);

    await sut.thenNotificationRowsAre([
      { kind: 'RENTAL_REQUEST_RECEIVED', recipientId: marc, requestId },
    ]);
    await sut.thenQueuedEmailsAre([
      { kind: 'RENTAL_REQUEST_RECEIVED', recipient: MARC_EMAIL },
    ]);
  });

  it('writes one notification and one email when the same moment is told twice', async () => {
    const sut = createKnexNotificationOutboxSUT();
    const marc = await sut.givenAccount(MARC_EMAIL);
    const requestId = await sut.givenRequestOnMarcPlace(marc, 'account-lea');
    await sut.whenNotifying(requestId, marc);

    await sut.whenNotifying(requestId, marc);

    await sut.thenNotificationRowsAre([
      { kind: 'RENTAL_REQUEST_RECEIVED', recipientId: marc, requestId },
    ]);
    await sut.thenQueuedEmailsAre([
      { kind: 'RENTAL_REQUEST_RECEIVED', recipient: MARC_EMAIL },
    ]);
  });

  it('tells the same person two different moments of the same request', async () => {
    const sut = createKnexNotificationOutboxSUT();
    const marc = await sut.givenAccount(MARC_EMAIL);
    const requestId = await sut.givenRequestOnMarcPlace(marc, 'account-lea');
    await sut.whenNotifying(requestId, marc, 'RENTAL_REQUEST_RECEIVED');

    await sut.whenNotifying(requestId, marc, 'RENTAL_CANCELLED_BY_RENTER');

    await sut.thenQueuedEmailsAre([
      { kind: 'RENTAL_CANCELLED_BY_RENTER', recipient: MARC_EMAIL },
      { kind: 'RENTAL_REQUEST_RECEIVED', recipient: MARC_EMAIL },
    ]);
  });

  it('keeps the notification but queues no email for an identifier no account carries', async () => {
    const sut = createKnexNotificationOutboxSUT();
    const requestId = await sut.givenRequestOnMarcPlace(
      'account-marc',
      'account-lea',
    );

    await sut.whenNotifying(requestId, 'account-marc');

    await sut.thenNotificationRowsAre([
      {
        kind: 'RENTAL_REQUEST_RECEIVED',
        recipientId: 'account-marc',
        requestId,
      },
    ]);
    await sut.thenQueuedEmailsAre([]);
  });

  it('leaves neither notification nor email behind a transaction that fails', async () => {
    const sut = createKnexNotificationOutboxSUT();
    const marc = await sut.givenAccount(MARC_EMAIL);
    const requestId = await sut.givenRequestOnMarcPlace(marc, 'account-lea');

    const failure = await sut.whenNotifyingInATransactionThatFails(
      requestId,
      marc,
    );

    sut.thenTheTransactionFailedOnItsLaterWrite(failure);
    await sut.thenNotificationRowsAre([]);
    await sut.thenQueuedEmailsAre([]);
  });
});
