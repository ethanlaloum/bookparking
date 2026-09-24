import { describe, expect, it } from 'vitest';

import { keepOrRenewIntent } from './RentalIntent';

const keys = () => {
  let next = 0;
  return () => `intention-${String(++next)}`;
};

describe('the intent identifier behind the booking button @SPEC-004', () => {
  it('follows the intent, not the click @EX-004-48', () => {
    const newKey = keys();
    const october = { listingId: 'annonce-1', fromDay: '2026-10-10', toDay: '2026-10-12' };

    const firstClick = keepOrRenewIntent(null, october, newKey);
    const secondClick = keepOrRenewIntent(firstClick, october, newKey);
    expect(secondClick.key).toBe(firstClick.key);

    const laterPeriod = keepOrRenewIntent(
      secondClick,
      { ...october, fromDay: '2026-10-20', toDay: '2026-10-22' },
      newKey,
    );
    expect(laterPeriod.key).not.toBe(firstClick.key);

    const otherPlace = keepOrRenewIntent(laterPeriod, { ...october, listingId: 'annonce-2' }, newKey);
    expect(otherPlace.key).not.toBe(laterPeriod.key);
  });
});
