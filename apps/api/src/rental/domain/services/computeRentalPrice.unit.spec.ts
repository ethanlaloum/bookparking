import { computeRentalPrice } from './computeRentalPrice';

const period = (from: string, to: string) => ({
  from: new Date(`${from}T00:00:00.000Z`),
  to: new Date(`${to}T00:00:00.000Z`),
});

describe('computeRentalPrice @SPEC-001', () => {
  it('prices a full calendar month at the monthly rate @EX-001-05', () => {
    const pricing = {
      dayInCents: 1200,
      weekInCents: 6000,
      monthInCents: 18000,
    };

    const price = computeRentalPrice(
      pricing,
      period('2026-10-01', '2026-10-31'),
    );

    expect(price).toEqual({ amountInCents: 18000 });
  });

  it('prices ten days at the cheapest combination of one week and three days @EX-001-20', () => {
    const pricing = {
      dayInCents: 1200,
      weekInCents: 6000,
      monthInCents: 18000,
    };

    const price = computeRentalPrice(
      pricing,
      period('2026-10-01', '2026-10-10'),
    );

    expect(price).toEqual({ amountInCents: 9600 });
    expect(price).not.toEqual({ amountInCents: 12000 });
    expect(price).not.toEqual({ amountInCents: 18000 });
  });

  it('finds no price when no offered duration covers the requested period @EX-001-21', () => {
    const pricing = {
      dayInCents: null,
      weekInCents: null,
      monthInCents: 18000,
    };

    const price = computeRentalPrice(
      pricing,
      period('2026-10-01', '2026-10-07'),
    );

    expect(price).toBeNull();
  });

  it('prices a tier combination to the cent without extra rounding @EX-001-23', () => {
    const pricing = { dayInCents: 1250, weekInCents: 5833, monthInCents: null };

    const price = computeRentalPrice(
      pricing,
      period('2026-10-01', '2026-10-10'),
    );

    expect(price).toEqual({ amountInCents: 9583 });
  });
});
