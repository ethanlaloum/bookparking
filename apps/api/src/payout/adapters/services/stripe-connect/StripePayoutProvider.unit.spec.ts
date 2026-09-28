import { PayoutUnavailableError } from '../../../domain/errors/PayoutUnavailableError';
import { createStripePayoutProviderSUT } from './StripePayoutProvider.sut';

describe('StripePayoutProvider', () => {
  it('creates a French Express account able to receive transfers, prefilled and idempotent', async () => {
    const sut = createStripePayoutProviderSUT();

    const id = await sut.provider.createAccount({
      accountId: 'account-marc',
      email: 'marc.d@example.com',
      idempotencyKey: 'payout-account-account-marc',
    });

    expect(id).toEqual('acct_marc');
    sut.thenCallIs('accounts.create', [
      {
        type: 'express',
        country: 'FR',
        business_type: 'individual',
        email: 'marc.d@example.com',
        capabilities: { transfers: { requested: true } },
        business_profile: {
          mcc: '7523',
          product_description:
            'Location de places de parking entre particuliers, sur Bookparking',
        },
        metadata: { accountId: 'account-marc' },
      },
      { idempotencyKey: 'payout-account-account-marc' },
    ]);
  });

  it('sends the owner back to the payouts tab after the Stripe pages', async () => {
    const sut = createStripePayoutProviderSUT();

    await sut.provider.onboardingLink('acct_marc');

    sut.thenCallIs('accountLinks.create', [
      {
        account: 'acct_marc',
        type: 'account_onboarding',
        refresh_url:
          'https://bookparking.fr/compte?onglet=versements&stripe=relance',
        return_url:
          'https://bookparking.fr/compte?onglet=versements&stripe=retour',
      },
    ]);
  });

  it('transfers the owner share out of the payment of the renter, under one key per request', async () => {
    const sut = createStripePayoutProviderSUT();

    const id = await sut.provider.transfer({
      stripeAccountId: 'acct_marc',
      amountInCents: 3825,
      paymentId: 'pi_lea',
      requestId: 'request-1',
      idempotencyKey: 'transfer-request-1',
    });

    expect(id).toEqual('tr_lea');
    sut.thenCallIs('transfers.create', [
      {
        amount: 3825,
        currency: 'eur',
        destination: 'acct_marc',
        transfer_group: 'request-1',
        metadata: { requestId: 'request-1' },
        source_transaction: 'ch_lea',
      },
      { idempotencyKey: 'transfer-request-1' },
    ]);
  });

  it('reads the charge when Stripe expands it', async () => {
    const sut = createStripePayoutProviderSUT();
    sut.givenTheLatestChargeIs({ id: 'ch_expanded' });

    await sut.provider.transfer({
      stripeAccountId: 'acct_marc',
      amountInCents: 3825,
      paymentId: 'pi_lea',
      requestId: 'request-1',
      idempotencyKey: 'transfer-request-1',
    });

    sut.thenCallIs('transfers.create', [
      expect.objectContaining({ source_transaction: 'ch_expanded' }),
      { idempotencyKey: 'transfer-request-1' },
    ]);
  });

  it('reads whether Stripe lets the account receive payouts', async () => {
    const sut = createStripePayoutProviderSUT();
    sut.givenPayoutsEnabled(false);

    expect(await sut.provider.payoutsEnabled('acct_marc')).toEqual(false);
  });

  it('reads an unreachable Stripe as unavailable, and lets a refusal through', async () => {
    const unreachable = createStripePayoutProviderSUT();
    unreachable.givenStripeCannotBeReached();
    const refusing = createStripePayoutProviderSUT();
    refusing.givenStripeRefuses();

    await expect(
      unreachable.provider.dashboardLink('acct_marc'),
    ).rejects.toBeInstanceOf(PayoutUnavailableError);
    await expect(
      refusing.provider.dashboardLink('acct_marc'),
    ).rejects.not.toBeInstanceOf(PayoutUnavailableError);
  });
});
