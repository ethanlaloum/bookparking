import { createCancelRentalRequestSUT } from './CancelRentalRequest.sut';

const REQUEST = '45fed099-ae81-4a57-b24e-7005a96cd4a0';
const AT = '2026-10-02T10:00:00.000Z';

describe('CancelRentalRequest — notifications', () => {
  it('tells both the renter and the owner that Bookparking cancelled the rental', async () => {
    const sut = createCancelRentalRequestSUT();
    sut.givenRequestBetween(REQUEST, {
      renterId: 'account-lea',
      ownerId: 'account-marc',
    });

    const result = await sut.whenCancelledBy(sut.admin, REQUEST, AT);

    sut.thenResultIsRight(result);
    sut.thenNotificationsAre([
      {
        kind: 'RENTAL_CANCELLED_BY_OPERATOR',
        recipientId: 'account-lea',
        requestId: REQUEST,
      },
      {
        kind: 'RENTAL_CANCELLED_BY_OPERATOR',
        recipientId: 'account-marc',
        requestId: REQUEST,
      },
    ]);
    sut.thenNotificationsWereCreatedAt([AT, AT]);
  });

  it('tells nobody when there was nothing to cancel', async () => {
    const sut = createCancelRentalRequestSUT();

    await sut.whenCancelledBy(sut.admin, REQUEST, AT);

    sut.thenNotificationsAre([]);
  });

  it('tells nobody when the account is not an administrator', async () => {
    const sut = createCancelRentalRequestSUT();
    sut.givenRequestBetween(REQUEST, {
      renterId: 'account-lea',
      ownerId: 'account-marc',
    });

    await sut.whenCancelledBy('account-lea', REQUEST, AT);

    sut.thenNotificationsAre([]);
  });
});
