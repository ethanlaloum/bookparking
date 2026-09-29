/**
 * L'application parle en jours ISO (`2026-10-01`), l'utilisateur tape
 * `01/10/2026`, et le calendrier manipule des `Date` locales. Ces quatre
 * fonctions sont les seuls passages entre les trois.
 */

const FRENCH = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/u;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/u;

const pad = (value: number): string => String(value).padStart(2, '0');

// `Date.UTC` reporte le 31 février au 3 mars sans rien dire : relire l'année,
// le mois et le jour obtenus est la seule façon de savoir que le jour existe.
const toDay = (year: number, month: number, day: number): string | null => {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return `${String(year)}-${pad(month)}-${pad(day)}`;
};

/** `jj/mm/aaaa` (séparateur `/`, `.` ou `-`) ou ISO ; `null` si le jour n'existe pas. */
export const parseDayInput = (text: string): string | null => {
  const trimmed = text.trim();
  const french = FRENCH.exec(trimmed);
  if (french !== null) return toDay(Number(french[3]), Number(french[2]), Number(french[1]));
  const iso = ISO.exec(trimmed);
  if (iso !== null) return toDay(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  return null;
};

export const formatDayInput = (day: string): string => {
  const iso = ISO.exec(day);
  if (iso === null || toDay(Number(iso[1]), Number(iso[2]), Number(iso[3])) === null) return '';
  return `${iso[3]}/${iso[2]}/${iso[1]}`;
};

/** À midi, heure locale : aucune bascule d'heure d'été ne le fait changer de jour. */
export const dateFromDay = (day: string): Date => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 12);
};

export const dayFromDate = (date: Date): string =>
  `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
