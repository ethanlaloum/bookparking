import { describe, expect, it } from 'vitest';

import { aNotification } from '../../../../store/testing/InMemoryDependencies';
import { destinationOf, isUnread, toneOf } from './Notification';

describe('where a notification leads', () => {
  it('takes the owner to the requests received on his places', () => {
    expect(destinationOf(aNotification({ audience: 'OWNER' }))).toEqual('received');
  });

  it('takes the renter to her own bookings', () => {
    expect(destinationOf(aNotification({ audience: 'RENTER' }))).toEqual('mine');
  });

  it('takes the owner to his payouts when money has left for his bank', () => {
    expect(
      destinationOf(aNotification({ kind: 'RENTAL_PAYOUT_SENT', audience: 'OWNER' })),
    ).toEqual('payouts');
  });
});

describe('how a notification reads', () => {
  it('is unread until the bell has been opened', () => {
    expect(isUnread(aNotification({ readAt: null }))).toEqual(true);
    expect(isUnread(aNotification({ readAt: '2026-10-01T09:00:00.000Z' }))).toEqual(false);
  });

  it('reads an accepted request as good news and a declined one as bad news', () => {
    expect(toneOf(aNotification({ kind: 'RENTAL_REQUEST_ACCEPTED' }))).toEqual('positive');
    expect(toneOf(aNotification({ kind: 'RENTAL_REQUEST_DECLINED' }))).toEqual('negative');
  });
});
