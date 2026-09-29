import { describe, expect, it } from 'vitest';

import { problemWithRequestedPeriod } from './RentalRequest';

const TODAY = '2026-09-22';

describe('a requested rental period', () => {
  it('is incomplete while either day is missing', () => {
    expect(problemWithRequestedPeriod({ fromDay: '2026-10-01' }, TODAY)).toBe('incomplete');
  });

  it('is reversed when the last day precedes the first', () => {
    expect(
      problemWithRequestedPeriod({ fromDay: '2026-10-05', toDay: '2026-10-01' }, TODAY),
    ).toBe('reversed');
  });

  it('is past when it starts before today', () => {
    expect(
      problemWithRequestedPeriod({ fromDay: '2026-09-21', toDay: '2026-09-25' }, TODAY),
    ).toBe('past');
  });

  it('is too long beyond three hundred and sixty-six days', () => {
    expect(
      problemWithRequestedPeriod({ fromDay: '2026-10-01', toDay: '2027-10-02' }, TODAY),
    ).toBe('too-long');
  });

  it('has no problem on a period of exactly three hundred and sixty-six days', () => {
    expect(
      problemWithRequestedPeriod({ fromDay: '2026-10-01', toDay: '2027-10-01' }, TODAY),
    ).toBeNull();
  });

  it('has no problem on a short period starting today', () => {
    expect(
      problemWithRequestedPeriod({ fromDay: TODAY, toDay: '2026-09-25' }, TODAY),
    ).toBeNull();
  });
});
