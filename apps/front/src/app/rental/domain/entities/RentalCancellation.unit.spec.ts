import { describe, expect, it } from 'vitest';

import { i18n } from '../../../../lib/i18n';
import { cancellationTermsOf } from './RentalCancellation';
import type { RentalRequestView } from './RentalRequestView';

// La location commence le 10/10/2026 à 00:00, heure de Paris ; l'échéance
// d'annulation gratuite tombe 24 heures plus tôt.
const aReservation = (overrides: Partial<RentalRequestView> = {}): RentalRequestView => ({
  id: 'demande-1',
  listingId: 'annonce-1',
  address: '12 rue Barla, 06300 Nice',
  box: '12',
  fromDay: '2026-10-10',
  toDay: '2026-10-12',
  priceInCents: 4500,
  status: 'CONFIRMED',
  requestedAt: '2026-10-01T07:00:00.000Z',
  confirmedAt: '2026-10-01T16:00:00.000Z',
  ...overrides,
  money: overrides.money ?? 'CAPTURED',
  startsAt: overrides.startsAt ?? '2026-10-09T22:00:00.000Z',
  freeCancellationUntil: overrides.freeCancellationUntil ?? '2026-10-08T22:00:00.000Z',
});

const FIVE_DAYS_BEFORE = new Date('2026-10-05T08:00:00.000Z');
const AFTER_THE_DEADLINE = new Date('2026-10-09T10:00:00.000Z');
const ONCE_STARTED = new Date('2026-10-10T06:00:00.000Z');

const read = (
  overrides: Partial<RentalRequestView>,
  perspective: 'renter' | 'owner',
  now: Date,
): string | null => {
  const { kind, amount } = cancellationTermsOf(aReservation(overrides), perspective, now);
  if (kind === 'unavailable') return null;
  return i18n.getFixedT('fr', 'account')(`cancel.terms.${kind}`, { amount }).replace(/\s/g, ' ');
};

describe('what cancelling costs, read before confirming @SPEC-005', () => {
  it('reads the cancellation terms before confirming @EX-005-15', () => {
    expect(read({}, 'renter', FIVE_DAYS_BEFORE)).toBe('Vous serez remboursé de 45,00 €.');
    expect(read({}, 'renter', AFTER_THE_DEADLINE)).toBe(
      'L’échéance d’annulation gratuite est passée : les 45,00 € prélevés ne seront pas remboursés.',
    );
    expect(read({ status: 'PENDING', money: 'AUTHORIZED' }, 'renter', AFTER_THE_DEADLINE)).toBe(
      'L’empreinte de 45,00 € sera levée : rien n’a été prélevé.',
    );
    expect(read({}, 'renter', ONCE_STARTED)).toBeNull();
    expect(read({}, 'owner', AFTER_THE_DEADLINE)).toBe('Le conducteur récupérera tout son argent.');
    expect(read({ status: 'PENDING', money: 'AUTHORIZED' }, 'owner', FIVE_DAYS_BEFORE)).toBe(
      'Le conducteur récupérera tout son argent.',
    );
  });
});
