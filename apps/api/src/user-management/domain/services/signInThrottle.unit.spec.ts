import {
  countRecentFailures,
  forgetFailuresFor,
  signInDelayInMilliseconds,
  SignInFailure,
} from './signInThrottle';

const MARC = 'marc.d@example.com';
const ORIGIN = '203.0.113.7';
const AT = new Date('2026-10-01T07:00:00.000Z');
const SIXTEEN_MINUTES_LATER = new Date('2026-10-01T07:16:00.000Z');

const failures = (howMany: number, at: Date = AT): SignInFailure[] =>
  Array.from({ length: howMany }, () => ({
    accountKey: MARC,
    originKey: ORIGIN,
    at,
  }));

describe('signInThrottle @SPEC-002', () => {
  it('delays the third consecutive failure by one second @EX-002-22', () => {
    const delay = signInDelayInMilliseconds(failures(2), {
      accountKey: MARC,
      originKey: ORIGIN,
      at: AT,
    });

    expect(delay).toEqual(1000);
  });

  it('caps the delay at thirty seconds @EX-002-23', () => {
    const delay = signInDelayInMilliseconds(failures(8), {
      accountKey: MARC,
      originKey: ORIGIN,
      at: AT,
    });

    expect(delay).toEqual(30000);
    expect(delay).not.toEqual(128000);
  });

  it('resets the failure counter after a successful sign-in @EX-002-24', () => {
    const remaining = forgetFailuresFor(failures(5), MARC);

    expect(countRecentFailures(remaining, MARC, AT)).toEqual(0);
    expect(
      signInDelayInMilliseconds(remaining, {
        accountKey: MARC,
        originKey: ORIGIN,
        at: AT,
      }),
    ).toEqual(0);
  });

  it('never locks the account out @EX-002-25', () => {
    const delay = signInDelayInMilliseconds(failures(20), {
      accountKey: MARC,
      originKey: ORIGIN,
      at: AT,
    });

    expect(Number.isFinite(delay)).toEqual(true);
    expect(delay).toEqual(30000);
    expect(
      countRecentFailures(forgetFailuresFor(failures(20), MARC), MARC, AT),
    ).toEqual(0);
  });
  it('delays an origin that tries several accounts @EX-002-26', () => {
    const fiveDifferentAccounts: SignInFailure[] = [
      'a@example.com',
      'b@example.com',
      'c@example.com',
      'd@example.com',
      'e@example.com',
    ].map((accountKey) => ({ accountKey, originKey: ORIGIN, at: AT }));

    const delay = signInDelayInMilliseconds(fiveDifferentAccounts, {
      accountKey: 'f@example.com',
      originKey: ORIGIN,
      at: AT,
    });

    expect(delay).not.toEqual(0);
    expect(
      countRecentFailures(fiveDifferentAccounts, 'f@example.com', AT),
    ).toEqual(0);
  });

  it('resets the failure counter after fifteen minutes without an attempt @EX-002-27', () => {
    const fiveOldFailures = failures(5, AT);

    expect(
      countRecentFailures(fiveOldFailures, MARC, SIXTEEN_MINUTES_LATER),
    ).toEqual(0);
    expect(
      signInDelayInMilliseconds(fiveOldFailures, {
        accountKey: MARC,
        originKey: ORIGIN,
        at: SIXTEEN_MINUTES_LATER,
      }),
    ).toEqual(0);
  });

  it('counts two simultaneous attempts as two failures @EX-002-28', () => {
    const twoRecorded = failures(2);
    const bothAtOnce: SignInFailure[] = [
      ...twoRecorded,
      { accountKey: MARC, originKey: ORIGIN, at: AT },
      { accountKey: MARC, originKey: ORIGIN, at: AT },
    ];

    expect(countRecentFailures(bothAtOnce, MARC, AT)).toEqual(4);
    expect(countRecentFailures(bothAtOnce, MARC, AT)).not.toEqual(3);
  });
});
