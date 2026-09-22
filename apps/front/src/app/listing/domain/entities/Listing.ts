import type { components } from '../../../../api/schema';

export type Pricing = components['schemas']['Pricing'];
export type Listing = components['schemas']['Listing'];
export type CalendarDay = string;

export const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;

export const dayIndexOf = (day: CalendarDay): number =>
  Math.round(Date.parse(`${day}T00:00:00.000Z`) / MILLISECONDS_PER_DAY);

export const dayCountOf = (from: CalendarDay, to: CalendarDay): number =>
  dayIndexOf(to) - dayIndexOf(from) + 1;

export const toCalendarDay = (instant: Date): CalendarDay => instant.toISOString().slice(0, 10);

export const hasAnyPrice = (pricing: Pricing): boolean =>
  pricing.dayInCents !== null || pricing.weekInCents !== null || pricing.monthInCents !== null;

export const isListingAvailableOn = (
  listing: Listing,
  from: CalendarDay,
  to: CalendarDay,
): boolean => {
  const openFrom = listing.availability.from.slice(0, 10);
  const openTo = listing.availability.to.slice(0, 10);
  return from >= openFrom && to <= openTo;
};

const sameDayNextMonthIndex = (startIndex: number): number => {
  const start = new Date(startIndex * MILLISECONDS_PER_DAY);
  const next = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate());
  return Math.round(next / MILLISECONDS_PER_DAY);
};

/**
 * Report fidèle de `computeRentalPrice` de l'api : un plus court chemin sur les
 * jours, où chaque palier est une arête. Un palier ne peut pas dépasser la fin
 * de la période, c'est pourquoi trois jours couverts par un seul tarif
 * hebdomadaire ne donnent aucun prix. Diverger d'un centime d'avec cette
 * fonction afficherait au locataire un montant que le back refusera.
 */
export const estimateRentalPriceInCents = (
  pricing: Pricing,
  from: CalendarDay,
  to: CalendarDay,
): number | null => {
  const dayCount = dayCountOf(from, to);
  if (!Number.isInteger(dayCount) || dayCount <= 0) return null;

  const fromIndex = dayIndexOf(from);
  const cheapestUpTo: (number | null)[] = Array.from({ length: dayCount + 1 }, () => null);
  cheapestUpTo[0] = 0;

  const offer = (end: number, cost: number): void => {
    if (end > dayCount) return;
    const current = cheapestUpTo[end];
    if (current === null || cost < current) cheapestUpTo[end] = cost;
  };

  for (let start = 0; start < dayCount; start += 1) {
    const costSoFar = cheapestUpTo[start];
    if (costSoFar === null) continue;
    if (pricing.dayInCents !== null) offer(start + 1, costSoFar + pricing.dayInCents);
    if (pricing.weekInCents !== null) offer(start + DAYS_PER_WEEK, costSoFar + pricing.weekInCents);
    if (pricing.monthInCents !== null) {
      const monthEnd = sameDayNextMonthIndex(fromIndex + start) - fromIndex;
      offer(monthEnd, costSoFar + pricing.monthInCents);
    }
  }

  return cheapestUpTo[dayCount];
};

export const cheapestNightlyRateInCents = (pricing: Pricing): number | null => {
  const rates: number[] = [];
  if (pricing.dayInCents !== null) rates.push(pricing.dayInCents);
  if (pricing.weekInCents !== null) rates.push(Math.round(pricing.weekInCents / 7));
  if (pricing.monthInCents !== null) rates.push(Math.round(pricing.monthInCents / 30));
  return rates.length === 0 ? null : Math.min(...rates);
};
