export interface StayDays {
  from: string;
  to: string;
}

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

const isCalendarDay = (value: string): boolean => {
  if (!CALENDAR_DAY.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value
  );
};

export const isReadableStay = (stay: StayDays): boolean =>
  isCalendarDay(stay.from) && isCalendarDay(stay.to) && stay.from <= stay.to;
