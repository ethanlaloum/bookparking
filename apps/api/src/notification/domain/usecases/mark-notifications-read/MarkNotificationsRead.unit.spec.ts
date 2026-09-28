import { createMarkNotificationsReadSUT } from './MarkNotificationsRead.sut';

describe('MarkNotificationsRead', () => {
  it('reads every unread notification of the account, and those of no other', async () => {
    const sut = createMarkNotificationsReadSUT();
    const unread = sut.givenNotification({ recipientId: 'account-lea' });
    const alreadyRead = sut.givenNotification({
      recipientId: 'account-lea',
      readAt: '2026-10-01T09:30:00.000Z',
    });
    const someoneElse = sut.givenNotification({ recipientId: 'account-marc' });

    const result = await sut.whenMarkingReadFor(
      'account-lea',
      '2026-10-01T10:00:00.000Z',
    );

    sut.thenResultIsRight(result);
    sut.thenReadAtAre({
      [unread]: '2026-10-01T10:00:00.000Z',
      [alreadyRead]: '2026-10-01T09:30:00.000Z',
      [someoneElse]: null,
    });
  });
});

describe('MarkNotificationRead', () => {
  it('reads one notification of the account, and no other', async () => {
    const sut = createMarkNotificationsReadSUT();
    const accepted = sut.givenNotification({ recipientId: 'account-lea' });
    const other = sut.givenNotification({ recipientId: 'account-lea' });

    const result = await sut.whenMarkingOneReadFor(
      'account-lea',
      accepted,
      '2026-10-01T10:00:00.000Z',
    );

    sut.thenResultIsRight(result);
    sut.thenReadAtAre({
      [accepted]: '2026-10-01T10:00:00.000Z',
      [other]: null,
    });
  });

  it('marks nothing of another account, even with its identifier', async () => {
    const sut = createMarkNotificationsReadSUT();
    const marcs = sut.givenNotification({ recipientId: 'account-marc' });

    await sut.whenMarkingOneReadFor(
      'account-lea',
      marcs,
      '2026-10-01T10:00:00.000Z',
    );

    sut.thenReadAtAre({ [marcs]: null });
  });
});
