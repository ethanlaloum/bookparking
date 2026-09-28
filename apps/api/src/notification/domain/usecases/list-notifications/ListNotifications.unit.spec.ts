import { createListNotificationsSUT } from './ListNotifications.sut';

const MARC = 'account-marc';
const LEA = 'account-lea';

describe('ListNotifications', () => {
  it('shows only the notifications of the account, newest first, and counts the unread ones', async () => {
    const sut = createListNotificationsSUT();
    const older = sut.aNotification({
      recipientId: MARC,
      createdAt: '2026-10-01T07:05:00.000Z',
      readAt: '2026-10-01T08:00:00.000Z',
    });
    const newer = sut.aNotification({
      recipientId: MARC,
      createdAt: '2026-10-02T07:05:00.000Z',
    });
    sut.aNotification({
      recipientId: LEA,
      createdAt: '2026-10-03T07:05:00.000Z',
    });

    const result = await sut.whenListingFor(MARC);

    sut.thenListIs(result, { ids: [newer, older], unreadCount: 1 });
  });

  it('shows the thirty latest, and still counts every unread one', async () => {
    const sut = createListNotificationsSUT();
    const ids = Array.from({ length: 31 }, (_, day) =>
      sut.aNotification({
        recipientId: MARC,
        createdAt: new Date(Date.UTC(2026, 9, 1 + day)).toISOString(),
      }),
    );

    const result = await sut.whenListingFor(MARC);

    sut.thenListIs(result, { ids: ids.slice(1).reverse(), unreadCount: 31 });
  });

  it('fails when the notifications cannot be read', async () => {
    const sut = createListNotificationsSUT();
    sut.givenTheInboxIsUnreachable();

    const result = await sut.whenListingFor(MARC);

    sut.thenResultIsLeft(result);
  });
});
