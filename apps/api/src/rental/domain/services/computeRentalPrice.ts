export interface RentalPricing {
  dayInCents: number | null;
  weekInCents: number | null;
  monthInCents: number | null;
}

export interface RentalPeriod {
  from: Date;
  to: Date;
}

export interface RentalPrice {
  amountInCents: number;
}

const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;

const daysBetween = (from: Date, to: Date): number =>
  Math.round((to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY);

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MILLISECONDS_PER_DAY);

const sameDayNextMonth = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()),
  );

export const computeRentalPrice = (
  pricing: RentalPricing,
  period: RentalPeriod,
): RentalPrice | null => {
  const dayCount = daysBetween(period.from, period.to) + 1;
  if (dayCount <= 0) return null;

  const cheapestUpTo: (number | null)[] = Array.from(
    { length: dayCount + 1 },
    () => null,
  );
  cheapestUpTo[0] = 0;

  const offer = (end: number, cost: number) => {
    if (end > dayCount) return;
    const current = cheapestUpTo[end];
    if (current === null || cost < current) cheapestUpTo[end] = cost;
  };

  for (let start = 0; start < dayCount; start++) {
    const costSoFar = cheapestUpTo[start];
    if (costSoFar === null) continue;
    if (pricing.dayInCents !== null)
      offer(start + 1, costSoFar + pricing.dayInCents);
    if (pricing.weekInCents !== null)
      offer(start + DAYS_PER_WEEK, costSoFar + pricing.weekInCents);
    if (pricing.monthInCents !== null) {
      const startDate = addDays(period.from, start);
      const monthEnd =
        start + daysBetween(startDate, sameDayNextMonth(startDate));
      offer(monthEnd, costSoFar + pricing.monthInCents);
    }
  }

  const amountInCents = cheapestUpTo[dayCount];
  return amountInCents === null ? null : { amountInCents };
};
