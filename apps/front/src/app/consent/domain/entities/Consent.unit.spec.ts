import { describe, expect, it } from 'vitest';

import {
  CONSENT_VERSION,
  acceptEverything,
  allows,
  choicesOf,
  grant,
  parseConsent,
  refuseEverything,
  restoreConsent,
  type Consent,
} from './Consent';

const DECIDED_AT = '2026-03-01T10:00:00.000Z';

const aConsent = (overrides: Partial<Consent> = {}): Consent => ({
  version: CONSENT_VERSION,
  decidedAt: DECIDED_AT,
  choices: { map: true, fonts: false },
  ...overrides,
});

describe('what a visitor has allowed', () => {
  it('allows nothing before any decision, since silence is not consent', () => {
    expect(allows(null, 'map')).toBe(false);
    expect(allows(null, 'fonts')).toBe(false);
  });

  it('allows exactly the purposes that were ticked, one by one', () => {
    const consent = aConsent({ choices: { map: true, fonts: false } });
    expect(allows(consent, 'map')).toBe(true);
    expect(allows(consent, 'fonts')).toBe(false);
  });

  it('presents every purpose unticked to someone who has not decided yet', () => {
    expect(choicesOf(null)).toEqual({ map: false, fonts: false });
  });
});

describe('the two one-click answers', () => {
  it('turns every purpose on when accepting everything', () => {
    expect(acceptEverything()).toEqual({ map: true, fonts: true });
  });

  it('turns every purpose off when refusing everything', () => {
    expect(refuseEverything()).toEqual({ map: false, fonts: false });
  });
});

describe('granting a single purpose from where it is needed', () => {
  it('grants the map alone to someone who had not decided yet', () => {
    expect(grant(null, 'map')).toEqual({ map: true, fonts: false });
  });

  it('keeps every other answer as it was', () => {
    const consent = aConsent({ choices: { map: false, fonts: true } });
    expect(grant(consent, 'map')).toEqual({ map: true, fonts: true });
  });
});

describe('how long a decision holds', () => {
  it('still holds on the hundred-and-eightieth day', () => {
    const consent = aConsent({ decidedAt: '2026-03-01T10:00:00.000Z' });
    expect(restoreConsent(consent, new Date('2026-08-28T09:59:59.000Z'))).toEqual(consent);
  });

  it('lapses once a hundred and eighty days have passed, and the question is asked again', () => {
    const consent = aConsent({ decidedAt: '2026-03-01T10:00:00.000Z' });
    expect(restoreConsent(consent, new Date('2026-08-28T10:00:00.000Z'))).toBeNull();
  });

  it('lapses when the purposes it answered are no longer the ones asked', () => {
    const consent = aConsent({ version: CONSENT_VERSION - 1 });
    expect(restoreConsent(consent, new Date('2026-03-02T10:00:00.000Z'))).toBeNull();
  });

  it('does not hold a decision whose date cannot be read', () => {
    const consent = aConsent({ decidedAt: 'hier' });
    expect(restoreConsent(consent, new Date('2026-03-02T10:00:00.000Z'))).toBeNull();
  });

  it('does not hold a decision dated in the future', () => {
    const consent = aConsent({ decidedAt: '2026-03-10T10:00:00.000Z' });
    expect(restoreConsent(consent, new Date('2026-03-02T10:00:00.000Z'))).toBeNull();
  });

  it('has nothing to restore when nothing was stored', () => {
    expect(restoreConsent(null, new Date('2026-03-02T10:00:00.000Z'))).toBeNull();
  });
});

describe('reading a decision back from the browser', () => {
  it('reads a well-formed record', () => {
    const stored = { version: CONSENT_VERSION, decidedAt: DECIDED_AT, choices: { map: true, fonts: false } };
    expect(parseConsent(stored)).toEqual(stored);
  });

  it('ignores a purpose it does not know rather than rejecting the record', () => {
    const stored = {
      version: CONSENT_VERSION,
      decidedAt: DECIDED_AT,
      choices: { map: true, fonts: false, audience: true },
    };
    expect(parseConsent(stored)).toEqual(aConsent({ choices: { map: true, fonts: false } }));
  });

  it('treats a record missing one purpose as no decision at all', () => {
    const stored = { version: CONSENT_VERSION, decidedAt: DECIDED_AT, choices: { map: true } };
    expect(parseConsent(stored)).toBeNull();
  });

  it('treats an answer that is not a yes or a no as no decision at all', () => {
    const stored = {
      version: CONSENT_VERSION,
      decidedAt: DECIDED_AT,
      choices: { map: 'true', fonts: false },
    };
    expect(parseConsent(stored)).toBeNull();
  });

  it('treats anything but an object as no decision at all', () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent('accepté')).toBeNull();
    expect(parseConsent({ version: CONSENT_VERSION, decidedAt: 42, choices: {} })).toBeNull();
    expect(parseConsent({ version: '1', decidedAt: DECIDED_AT, choices: { map: true, fonts: true } })).toBeNull();
  });
});
