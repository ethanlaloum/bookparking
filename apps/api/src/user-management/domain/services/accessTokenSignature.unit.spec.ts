import { issueAccessToken } from './issueAccessToken';
import { slidingAccessToken } from './slidingAccessToken';

const SECRET = 'une-cle-de-test-suffisamment-longue-pour-etre-credible';
const ACCOUNT_ID = 'account-marc';
const ISSUED_AT = new Date('2026-10-01T07:00:00.000Z');
const PRESENTED_AT = new Date('2026-10-02T07:00:00.000Z');

describe('accessTokenSignature @SPEC-002', () => {
  it('refuses a token that was never issued by the server', () => {
    const forged = Buffer.from(
      JSON.stringify({
        accountId: 'compte-de-quelquun-dautre',
        issuedAt: ISSUED_AT.toISOString(),
        validUntil: new Date('2027-10-01T07:00:00.000Z').toISOString(),
      }),
      'utf8',
    ).toString('base64url');

    expect(slidingAccessToken(forged, PRESENTED_AT, SECRET)).toEqual(null);
  });

  it('refuses a genuine token whose payload was altered', () => {
    const issued = issueAccessToken(ACCOUNT_ID, ISSUED_AT, SECRET);
    const [payload, signature] = issued.token.split('.');
    const altered = Buffer.from(
      JSON.stringify({
        accountId: 'compte-de-quelquun-dautre',
        issuedAt: ISSUED_AT.toISOString(),
        validUntil: new Date('2027-10-01T07:00:00.000Z').toISOString(),
      }),
      'utf8',
    ).toString('base64url');

    expect(payload).not.toEqual(altered);
    expect(
      slidingAccessToken(`${altered}.${signature}`, PRESENTED_AT, SECRET),
    ).toEqual(null);
  });

  it('refuses a token signed with another key', () => {
    const issued = issueAccessToken(ACCOUNT_ID, ISSUED_AT, 'une-autre-cle');

    expect(slidingAccessToken(issued.token, PRESENTED_AT, SECRET)).toEqual(
      null,
    );
  });

  it('accepts a token it issued itself', () => {
    const issued = issueAccessToken(ACCOUNT_ID, ISSUED_AT, SECRET);

    const accepted = slidingAccessToken(issued.token, PRESENTED_AT, SECRET);

    expect(accepted).not.toEqual(null);
    expect(accepted?.accountId).toEqual(ACCOUNT_ID);
  });
});
