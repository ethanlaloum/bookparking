import { describe, it } from 'vitest';

import { createRequestRentalSut } from './requestRentalEpic.sut';

const PAYLOAD = {
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  fromDay: '2026-10-01',
  toDay: '2026-10-03',
};

describe('requesting a rental', () => {
  it('sends the renter to the payment page the api opened', () => {
    const sut = createRequestRentalSut();
    sut.givenTheApiOpensThePaymentPage('https://checkout.stripe.com/c/pay/cs_test_lea');
    sut.whenRequesting(PAYLOAD);
    sut.thenTheRequestSucceeded();
    sut.thenThePaymentPagesOpenedAre(['https://checkout.stripe.com/c/pay/cs_test_lea']);
  });

  it('follows no payment address outside Stripe, even one that starts like it', () => {
    const sut = createRequestRentalSut();
    sut.givenTheApiOpensThePaymentPage('https://checkout.stripe.com.exemple.fr/c/pay/cs_test_lea');
    sut.whenRequesting(PAYLOAD);
    sut.thenThePaymentPagesOpenedAre([]);
    sut.thenTheErrorShownIs('Adresse de paiement inattendue');
  });

  it('goes nowhere, and says so, when the api answers without a payment page', () => {
    const sut = createRequestRentalSut();
    sut.givenTheApiAnswersWithoutBody();
    sut.whenRequesting(PAYLOAD);
    sut.thenThePaymentPagesOpenedAre([]);
    sut.thenTheErrorShownIs('Le serveur n’a ouvert aucune page de paiement. Réessayez dans un instant.');
  });

  it('shows the api message when the dates are already rented', () => {
    const sut = createRequestRentalSut();
    sut.givenTheApiRejectsWith('Ces dates sont deja louees');
    sut.whenRequesting(PAYLOAD);
    sut.thenTheErrorShownIs('Ces dates sont deja louees');
    sut.thenThePaymentPagesOpenedAre([]);
  });
});
