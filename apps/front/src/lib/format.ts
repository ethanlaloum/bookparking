const EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const EURO_PRECISE = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export const formatCents = (cents: number): string =>
  cents % 100 === 0 ? EURO.format(cents / 100) : EURO_PRECISE.format(cents / 100);

export const formatDay = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );

export const formatShortDay = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso));

export const todayAsCalendarDay = (): string => new Date().toISOString().slice(0, 10);

export const centsFromInput = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const asEuros = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(asEuros)) return undefined;
  return Math.round(asEuros * 100);
};

export const inputFromCents = (cents: number | null): string =>
  cents === null ? '' : String(cents / 100);
