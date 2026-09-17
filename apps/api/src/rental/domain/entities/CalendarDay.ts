import { RentalPeriod } from '../services/computeRentalPrice';

export type CalendarDay = string;

export interface CalendarDayRange {
  from: CalendarDay;
  to: CalendarDay;
}

export const PARIS_TIME_ZONE = 'Europe/Paris';

const MILLISECONDS_PER_DAY = 86_400_000;

const wallClockAsUtc = (instant: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const valueOf = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value);

  return Date.UTC(
    valueOf('year'),
    valueOf('month') - 1,
    valueOf('day'),
    valueOf('hour'),
    valueOf('minute'),
    valueOf('second'),
  );
};

const offsetInMs = (instant: Date, timeZone: string): number =>
  wallClockAsUtc(instant, timeZone) - instant.getTime();

export const zonedTimeToUtc = (wallClock: string, timeZone: string): Date => {
  const readAsUtc = Date.parse(`${wallClock}Z`);
  const firstGuess = readAsUtc - offsetInMs(new Date(readAsUtc), timeZone);
  return new Date(readAsUtc - offsetInMs(new Date(firstGuess), timeZone));
};

export const zonedDayStart = (day: CalendarDay, timeZone: string): Date =>
  zonedTimeToUtc(`${day}T00:00:00.000`, timeZone);

export const dayAfter = (day: CalendarDay): CalendarDay =>
  new Date(Date.parse(`${day}T00:00:00.000Z`) + MILLISECONDS_PER_DAY)
    .toISOString()
    .slice(0, 10);

export const dayCountOfDays = (days: CalendarDayRange): number =>
  Math.round(
    (Date.parse(`${days.to}T00:00:00.000Z`) -
      Date.parse(`${days.from}T00:00:00.000Z`)) /
      MILLISECONDS_PER_DAY,
  ) + 1;

export const isReadableDayRange = (days: CalendarDayRange): boolean => {
  const dayCount = dayCountOfDays(days);
  return Number.isInteger(dayCount) && dayCount > 0;
};

export const parisDayOf = (instant: Date): CalendarDay =>
  new Intl.DateTimeFormat('fr-CA', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);

export const parisPeriodOfDays = (days: CalendarDayRange): RentalPeriod => ({
  from: zonedDayStart(days.from, PARIS_TIME_ZONE),
  to: new Date(zonedDayStart(dayAfter(days.to), PARIS_TIME_ZONE).getTime() - 1),
});

/**
 * computeRentalPrice counts days by dividing a getTime() gap by 86 400 000 and
 * knows no time zone: fed the Paris instants above it reads a 30-day October as
 * 29 days and 23 hours whenever a DST switch falls inside the period, and
 * prices the wrong number of days. The tiers are always measured on the pair of
 * UTC midnights standing for the same Europe/Paris calendar days.
 */
export const dayCountingPeriodOfDays = (
  days: CalendarDayRange,
): RentalPeriod => ({
  from: new Date(`${days.from}T00:00:00.000Z`),
  to: new Date(`${days.to}T00:00:00.000Z`),
});
