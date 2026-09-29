import { NotificationKind } from '../../../shared/notification-outbox/domain/entities/Notification';
import { audienceOf } from './NotificationView';

describe('audienceOf', () => {
  it.each<[NotificationKind, 'OWNER' | 'RENTER']>([
    ['RENTAL_REQUEST_RECEIVED', 'OWNER'],
    ['RENTAL_REQUEST_UNANSWERED', 'OWNER'],
    ['RENTAL_CANCELLED_BY_RENTER', 'OWNER'],
    ['RENTAL_PAYOUT_SENT', 'OWNER'],
    ['RENTAL_REQUEST_ACCEPTED', 'RENTER'],
    ['RENTAL_REQUEST_DECLINED', 'RENTER'],
    ['RENTAL_REQUEST_EXPIRED', 'RENTER'],
    ['RENTAL_CANCELLED_BY_OWNER', 'RENTER'],
    ['RENTAL_PAYMENT_FAILED', 'RENTER'],
  ])('sends %s to the %s whoever reads it', (kind, audience) => {
    expect(audienceOf(kind, true)).toEqual(audience);
    expect(audienceOf(kind, false)).toEqual(audience);
  });

  it('sends a cancellation by Bookparking to the side the reader stands on', () => {
    expect(audienceOf('RENTAL_CANCELLED_BY_OPERATOR', true)).toEqual('RENTER');
    expect(audienceOf('RENTAL_CANCELLED_BY_OPERATOR', false)).toEqual('OWNER');
  });
});
