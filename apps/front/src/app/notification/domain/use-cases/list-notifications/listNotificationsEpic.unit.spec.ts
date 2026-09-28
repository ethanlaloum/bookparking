import { describe, it } from 'vitest';

import { createNotificationsSut } from './listNotificationsEpic.sut';

describe('reading the bell', () => {
  it('shows the notifications the api holds and the number still unread', () => {
    const sut = createNotificationsSut();
    sut.givenTheApiHolds(
      [
        sut.aNotification({ id: 'recue' }),
        sut.aNotification({ id: 'acceptee', readAt: '2026-10-01T09:00:00.000Z' }),
      ],
      4,
    );

    sut.whenTheBellIsRead();

    sut.thenTheNotificationsShownAre(['recue', 'acceptee']);
    sut.thenTheBadgeShows(4);
    sut.thenTheBellIsNotLoading();
  });

  it('keeps what it showed when a later reading fails', () => {
    const sut = createNotificationsSut();
    sut.givenTheApiHolds([sut.aNotification({ id: 'recue' })], 1);
    sut.whenTheBellIsRead();
    sut.givenTheListFailsWith('Le serveur est injoignable. Vérifiez votre connexion.');

    sut.whenTheBellIsRead();

    sut.thenTheNotificationsShownAre(['recue']);
    sut.thenTheBadgeShows(1);
    sut.thenTheErrorShownIs('Le serveur est injoignable. Vérifiez votre connexion.');
  });

  it('forgets every notification on sign-out, so the next account does not see them', () => {
    const sut = createNotificationsSut();
    sut.givenTheApiHolds([sut.aNotification({ id: 'recue' })], 1);
    sut.whenTheBellIsRead();

    sut.whenSigningOut();

    sut.thenTheNotificationsShownAre([]);
    sut.thenTheBadgeShows(0);
  });
});

describe('opening the bell', () => {
  it('clears the badge once the api has read them, but still shows which ones were new', () => {
    const sut = createNotificationsSut();
    sut.givenTheApiHolds(
      [
        sut.aNotification({ id: 'recue' }),
        sut.aNotification({ id: 'acceptee', readAt: '2026-10-01T09:00:00.000Z' }),
      ],
      1,
    );
    sut.whenTheBellIsRead();

    sut.whenTheBellIsOpened();

    sut.thenTheApiWasAskedToMarkRead(1);
    sut.thenTheBadgeShows(0);
    sut.thenTheUnreadNotificationsShownAre(['recue']);
  });

  it('keeps the badge when the api could not mark them read', () => {
    const sut = createNotificationsSut();
    sut.givenTheApiHolds([sut.aNotification({ id: 'recue' })], 1);
    sut.whenTheBellIsRead();
    sut.givenMarkingReadFailsWith('Erreur réseau');

    sut.whenTheBellIsOpened();

    sut.thenTheBadgeShows(1);
  });
});
