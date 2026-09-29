import { describe, expect, it } from 'vitest';

import { i18n } from '../../../../lib/i18n';

import {
  canConfirmArrival,
  isIssueAnswerable,
  confirmedRevenueInCents,
  countByStatus,
  moneyLabelOf,
  pendingRevenueInCents,
  rentedNightCount,
  type RentalIssue,
  type RentalRequestView,
} from './RentalRequestView';

const aRequest = (overrides: Partial<RentalRequestView> = {}): RentalRequestView => ({
  id: 'demande-1',
  listingId: 'annonce-1',
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  fromDay: '2026-10-01',
  toDay: '2026-10-03',
  priceInCents: 4500,
  status: 'PENDING',
  requestedAt: '2026-09-20T09:00:00.000Z',
  confirmedAt: null,
  ...overrides,
  // Réaffirmés après l'étalement : `Partial` rend chaque champ `undefined`-able.
  money: overrides.money ?? 'NONE',
  startsAt: overrides.startsAt ?? '2026-09-30T22:00:00.000Z',
  freeCancellationUntil: overrides.freeCancellationUntil ?? '2026-09-29T22:00:00.000Z',
  answerBy: overrides.answerBy === undefined ? null : overrides.answerBy,
  accessInstructions:
    overrides.accessInstructions === undefined ? null : overrides.accessInstructions,
  ownerShareInCents:
    overrides.ownerShareInCents === undefined ? null : overrides.ownerShareInCents,
  arrivedAt: overrides.arrivedAt === undefined ? null : overrides.arrivedAt,
  issue: overrides.issue === undefined ? null : overrides.issue,
  issueReportable: overrides.issueReportable ?? false,
});

describe('the owner revenue', () => {
  it('sums only the confirmed requests', () => {
    const requests = [
      aRequest({ status: 'CONFIRMED', priceInCents: 4500 }),
      aRequest({ status: 'CONFIRMED', priceInCents: 8000 }),
      aRequest({ status: 'PENDING', priceInCents: 9900 }),
      aRequest({ status: 'EXPIRED', priceInCents: 7000 }),
    ];
    expect(confirmedRevenueInCents(requests)).toBe(12500);
  });

  it('is nothing when no request was ever confirmed', () => {
    expect(confirmedRevenueInCents([aRequest({ status: 'PENDING' })])).toBe(0);
  });

  it('counts a pending request as expected income, not as revenue', () => {
    const requests = [
      aRequest({ status: 'CONFIRMED', priceInCents: 4500 }),
      aRequest({ status: 'PENDING', priceInCents: 9900 }),
    ];
    expect(confirmedRevenueInCents(requests)).toBe(4500);
    expect(pendingRevenueInCents(requests)).toBe(9900);
  });

  it('leaves an expired request out of both totals', () => {
    const requests = [aRequest({ status: 'EXPIRED', priceInCents: 7000 })];
    expect(confirmedRevenueInCents(requests)).toBe(0);
    expect(pendingRevenueInCents(requests)).toBe(0);
  });
});

describe('a rental request', () => {
  it('counts both bounds of its period as rented nights', () => {
    expect(rentedNightCount(aRequest({ fromDay: '2026-10-01', toDay: '2026-10-03' }))).toBe(3);
  });

  it('counts a single day as one night', () => {
    expect(rentedNightCount(aRequest({ fromDay: '2026-10-01', toDay: '2026-10-01' }))).toBe(1);
  });
});

describe('the request counts', () => {
  it('tallies every status, including those with nothing', () => {
    const requests = [
      aRequest({ status: 'PENDING' }),
      aRequest({ status: 'PENDING' }),
      aRequest({ status: 'CONFIRMED' }),
    ];
    expect(countByStatus(requests)).toEqual({
      AWAITING_PAYMENT: 0,
      PENDING: 2,
      CONFIRMED: 1,
      EXPIRED: 0,
      CANCELLED: 0,
      ABANDONED: 0,
      PAYMENT_FAILED: 0,
    });
  });
});

describe('where the renter money stands @SPEC-004', () => {
  const read = (overrides: Partial<RentalRequestView>): string => {
    const { key, amount } = moneyLabelOf(aRequest({ priceInCents: 4500, ...overrides }));
    return i18n.getFixedT('fr', 'account')(`money.${key}`, { amount }).replace(/\s/g, ' ');
  };

  it('labels every state of the renter money @EX-004-37', () => {
    expect(read({ status: 'AWAITING_PAYMENT', money: 'NONE' })).toBe(
      'Paiement en cours de vérification',
    );
    expect(read({ status: 'PENDING', money: 'AUTHORIZED' })).toBe(
      'Empreinte de 45,00 € · en attente du loueur',
    );
    expect(read({ status: 'CONFIRMED', money: 'CAPTURED' })).toBe('Confirmée · 45,00 € prélevés');
    expect(read({ status: 'EXPIRED', money: 'RELEASED' })).toBe('Expirée · rien n’a été prélevé');
    expect(read({ status: 'CANCELLED', money: 'REFUNDED' })).toBe('Annulée · 45,00 € remboursés');
    expect(read({ status: 'CANCELLED', money: 'REFUND_DUE' })).toBe(
      'Annulée · remboursement en cours',
    );
    expect(read({ status: 'EXPIRED', money: 'RELEASE_DUE' })).toBe(
      'Expirée · empreinte en cours de levée',
    );
    expect(read({ status: 'ABANDONED', money: 'NONE' })).toBe('Paiement abandonné');
    expect(read({ status: 'PAYMENT_FAILED', money: 'RELEASE_DUE' })).toBe(
      'Paiement refusé par la banque',
    );
  });
});

describe('a late cancellation, read as such @SPEC-005', () => {
  it('labels a rental cancelled without refund @EX-005-16', () => {
    const { key, amount } = moneyLabelOf(
      aRequest({ status: 'CANCELLED', money: 'CAPTURED', priceInCents: 4500 }),
    );
    expect(
      i18n.getFixedT('fr', 'account')(`money.${key}`, { amount }).replace(/\s/g, ' '),
    ).toBe('Annulée · 45,00 € non remboursés');
  });
});


describe('what the owner earns and when the renter says she arrived', () => {
  it('counts what the owner receives once the commission is taken, not what the renter paid', () => {
    expect(
      confirmedRevenueInCents([
        aRequest({ status: 'CONFIRMED', priceInCents: 4500, ownerShareInCents: 3825 }),
      ]),
    ).toEqual(3825);
  });

  it('lets the renter confirm her arrival from the first instant of a confirmed booking, once', () => {
    const starts = '2026-10-09T22:00:00.000Z';
    const booking = aRequest({ status: 'CONFIRMED', startsAt: starts });

    expect(canConfirmArrival(booking, new Date('2026-10-09T21:59:59.000Z'))).toEqual(false);
    expect(canConfirmArrival(booking, new Date(starts))).toEqual(true);
    expect(
      canConfirmArrival({ ...booking, arrivedAt: starts }, new Date('2026-10-10T08:00:00.000Z')),
    ).toEqual(false);
    expect(
      canConfirmArrival({ ...booking, status: 'PENDING' }, new Date('2026-10-10T08:00:00.000Z')),
    ).toEqual(false);
  });

  it('hides the arrival while a reported problem freezes the money, and gives it back once dismissed', () => {
    const booking = aRequest({ status: 'CONFIRMED', startsAt: '2026-10-09T22:00:00.000Z' });
    const now = new Date('2026-10-10T08:00:00.000Z');

    expect(canConfirmArrival({ ...booking, issue: anIssue('OPEN') }, now)).toEqual(false);
    expect(canConfirmArrival({ ...booking, issue: anIssue('DISMISSED') }, now)).toEqual(true);
  });

  it('lets the owner answer an open report once', () => {
    const booking = aRequest({ status: 'CONFIRMED' });

    expect(isIssueAnswerable({ ...booking, issue: anIssue('OPEN') })).toEqual(true);
    expect(
      isIssueAnswerable({ ...booking, issue: { ...anIssue('OPEN'), ownerReply: 'Code 4821B.' } }),
    ).toEqual(false);
    expect(isIssueAnswerable({ ...booking, issue: anIssue('REFUNDED') })).toEqual(false);
    expect(isIssueAnswerable(booking)).toEqual(false);
  });
});

function anIssue(status: RentalIssue['status']): RentalIssue {
  return {
    reason: 'NO_ACCESS',
    message: null,
    reportedAt: '2026-10-10T08:00:00.000Z',
    status,
    ownerReply: null,
    ownerRepliedAt: null,
    refundInCents: status === 'REFUNDED' ? 4500 : null,
    resolvedAt: status === 'OPEN' ? null : '2026-10-10T10:00:00.000Z',
  };
}
