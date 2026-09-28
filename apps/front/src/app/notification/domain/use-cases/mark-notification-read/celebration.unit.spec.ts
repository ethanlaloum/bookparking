import { describe, it } from 'vitest';

import { createCelebrationSut } from './celebration.sut';

describe('celebrating a confirmed booking', () => {
  it('celebrates a booking the owner confirmed and nobody has shown yet', () => {
    const sut = createCelebrationSut();
    sut.givenTheBellHolds([
      sut.aNotification({ id: 'recue', kind: 'RENTAL_REQUEST_RECEIVED' }),
      sut.accepted({ id: 'confirmee' }),
    ]);

    sut.thenTheBookingCelebratedIs('confirmee');
  });

  it('celebrates nothing already read, and nothing that is not a confirmation', () => {
    const sut = createCelebrationSut();
    sut.givenTheBellHolds([
      sut.accepted({ id: 'deja-lue', readAt: '2026-10-01T10:00:00.000Z' }),
      sut.aNotification({ id: 'refusee', kind: 'RENTAL_REQUEST_DECLINED', audience: 'RENTER' }),
    ]);

    sut.thenTheBookingCelebratedIs(null);
  });

  it('celebrates once: dismissing it marks it read, and the badge drops', () => {
    const sut = createCelebrationSut();
    sut.givenTheBellHolds([sut.accepted({ id: 'confirmee' })]);

    sut.whenTheCelebrationIsDismissed('confirmee');

    sut.thenTheBookingCelebratedIs(null);
    sut.thenTheApiMarkedRead(['confirmee']);
    sut.thenTheBadgeShows(0);
  });

  it('celebrates the oldest first, then the next one', () => {
    const sut = createCelebrationSut();
    sut.givenTheBellHolds([
      sut.accepted({ id: 'recente', createdAt: '2026-10-02T09:00:00.000Z' }),
      sut.accepted({ id: 'ancienne', createdAt: '2026-10-01T09:00:00.000Z' }),
    ]);
    sut.thenTheBookingCelebratedIs('ancienne');

    sut.whenTheCelebrationIsDismissed('ancienne');

    sut.thenTheBookingCelebratedIs('recente');
  });

  it('celebrates nothing the bell has already shown', () => {
    const sut = createCelebrationSut();
    sut.givenTheBellHolds([sut.accepted({ id: 'confirmee' })]);

    sut.whenTheBellIsOpened();

    sut.thenTheBookingCelebratedIs(null);
  });
});
