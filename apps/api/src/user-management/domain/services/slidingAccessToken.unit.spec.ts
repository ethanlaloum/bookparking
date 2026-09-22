import { issueAccessToken } from './issueAccessToken';
import { slidingAccessToken } from './slidingAccessToken';

const ACCOUNT_ID = 'account-marc';

describe('slidingAccessToken @SPEC-002', () => {
  it('extends the token when it is used before it expires @EX-002-15', () => {
    const issued = issueAccessToken(
      ACCOUNT_ID,
      new Date('2026-10-01T07:00:00.000Z'),
    );

    const extended = slidingAccessToken(
      issued.token,
      new Date('2026-10-08T06:59:00.000Z'),
    );

    expect(extended).not.toEqual(null);
    expect(extended?.accountId).toEqual(ACCOUNT_ID);
    expect(extended?.validUntil).toEqual(new Date('2026-10-15T06:59:00.000Z'));
  });

  it('refuses a token left unused for seven days @EX-002-16', () => {
    const issued = issueAccessToken(
      ACCOUNT_ID,
      new Date('2026-10-01T07:00:00.000Z'),
    );

    const refused = slidingAccessToken(
      issued.token,
      new Date('2026-10-08T07:01:00.000Z'),
    );

    expect(refused).toEqual(null);
  });

  it('refuses a token 168 hours old though the local clock shows less than seven days @EX-002-19', () => {
    const issued = issueAccessToken(
      ACCOUNT_ID,
      new Date('2026-10-23T07:00:00.000Z'),
    );

    const refused = slidingAccessToken(
      issued.token,
      new Date('2026-10-30T07:30:00.000Z'),
    );

    expect(refused).toEqual(null);
  });
});
