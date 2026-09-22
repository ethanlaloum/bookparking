import { issueAccessToken } from '../../../domain/services/issueAccessToken';
import { SlidingAccessTokenVerifier } from './SlidingAccessTokenVerifier';

const SECRET = 'secret-de-test-suffisamment-long-pour-signer';

describe('SlidingAccessTokenVerifier @SPEC-002', () => {
  it('accepts a token the server issued', async () => {
    const verifier = new SlidingAccessTokenVerifier(SECRET);
    const issued = issueAccessToken('account-marc', new Date(), SECRET);

    expect(await verifier.verify(issued.token)).toEqual({ id: 'account-marc' });
  });

  it('refuses a forged token', async () => {
    const verifier = new SlidingAccessTokenVerifier(SECRET);
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
