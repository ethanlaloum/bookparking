import { Account } from '../../../domain/entities/Account';
import { issueAccessToken } from '../../../domain/services/issueAccessToken';
import { InMemoryAccountRepository } from '../../repositories/account/InMemoryAccountRepository';
import { SlidingAccessTokenVerifier } from './SlidingAccessTokenVerifier';

const SECRET = 'secret-de-test-suffisamment-long-pour-signer';

const accountsHolding = (accountId: string): InMemoryAccountRepository => {
  const accounts = new InMemoryAccountRepository();
  accounts.accountList.push(
    Account.fromState({
      id: accountId,
      email: 'marc.d@example.com',
      passwordHash: 'stub-password-hash',
      registeredAt: new Date('2026-09-01T00:00:00.000Z'),
      termsAcceptedAt: new Date('2026-09-01T00:00:00.000Z'),
      avatar: 'SIGNAL',
      suspendedAt: null,
    }),
  );
  return accounts;
};

describe('SlidingAccessTokenVerifier @SPEC-002', () => {
  it('accepts a token the server issued', async () => {
    const verifier = new SlidingAccessTokenVerifier(
      SECRET,
      accountsHolding('account-marc'),
    );
    const issued = issueAccessToken('account-marc', new Date(), SECRET);

    expect(await verifier.verify(issued.token)).toEqual({ id: 'account-marc' });
  });

  it('refuses a forged token', async () => {
    const verifier = new SlidingAccessTokenVerifier(
      SECRET,
      accountsHolding('compte-de-quelquun-dautre'),
    );
    const forged = Buffer.from(
      JSON.stringify({
        accountId: 'compte-de-quelquun-dautre',
        issuedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
      }),
      'utf8',
    ).toString('base64url');

    expect(await verifier.verify(`${forged}.signature-inventee`)).toEqual(null);
  });
});

describe('SlidingAccessTokenVerifier', () => {
  it('refuses a token whose account was deleted', async () => {
    const accounts = accountsHolding('account-marc');
    const verifier = new SlidingAccessTokenVerifier(SECRET, accounts);
    const issued = issueAccessToken('account-marc', new Date(), SECRET);

    await accounts.delete('account-marc');

    expect(await verifier.verify(issued.token)).toEqual(null);
  });
});
