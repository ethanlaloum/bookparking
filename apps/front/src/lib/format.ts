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

export const formatCentsPrecisely = (cents: number): string =>
  EURO_PRECISE.format(cents / 100);

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

/**
 * Une console de modération se lit à la minute : « le 20 sept. » ne dit pas si
 * la demande a dormi une heure ou vingt-trois, et c'est exactement la question
 * que pose le bloc « à surveiller ».
 */
export const formatMoment = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export const formatCount = (value: number): string =>
  new Intl.NumberFormat('fr-FR').format(value);
