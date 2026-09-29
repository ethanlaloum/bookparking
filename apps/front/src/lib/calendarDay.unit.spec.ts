import { describe, expect, it } from 'vitest';

import { dateFromDay, dayFromDate, formatDayInput, parseDayInput } from './calendarDay';

describe('parseDayInput', () => {
  it('lit une date saisie à la française', () => {
    expect(parseDayInput('01/10/2026')).toBe('2026-10-01');
  });

  it('accepte un jour et un mois sur un seul chiffre, et le point ou le tiret comme séparateur', () => {
    expect(parseDayInput('1/9/2026')).toBe('2026-09-01');
    expect(parseDayInput('01.10.2026')).toBe('2026-10-01');
    expect(parseDayInput('01-10-2026')).toBe('2026-10-01');
  });

  // Le barreau e2e remplit les champs de date par `fill('2026-10-01')` :
  // la forme ISO doit rester une saisie valide, pas seulement une valeur interne.
  it('accepte la forme ISO', () => {
    expect(parseDayInput('2026-10-01')).toBe('2026-10-01');
  });

  it('ignore les espaces autour de la saisie', () => {
    expect(parseDayInput('  01/10/2026 ')).toBe('2026-10-01');
  });

  it("refuse un jour qui n'existe pas plutôt que de le reporter au mois suivant", () => {
    expect(parseDayInput('31/02/2026')).toBeNull();
    expect(parseDayInput('2026-02-30')).toBeNull();
  });

  it('accepte le 29 février des seules années bissextiles', () => {
    expect(parseDayInput('29/02/2028')).toBe('2028-02-29');
    expect(parseDayInput('29/02/2026')).toBeNull();
  });

  it('refuse une saisie incomplète ou illisible', () => {
    expect(parseDayInput('')).toBeNull();
    expect(parseDayInput('01/10')).toBeNull();
    expect(parseDayInput('01/10/26')).toBeNull();
    expect(parseDayInput('demain')).toBeNull();
    expect(parseDayInput('00/10/2026')).toBeNull();
    expect(parseDayInput('01/13/2026')).toBeNull();
  });
});

describe('formatDayInput', () => {
  it('écrit un jour ISO sous la forme saisissable jj/mm/aaaa', () => {
    expect(formatDayInput('2026-10-01')).toBe('01/10/2026');
  });

  it('rend une chaîne vide pour un jour absent ou illisible', () => {
    expect(formatDayInput('')).toBe('');
    expect(formatDayInput('n’importe quoi')).toBe('');
  });

  it('relit ce qu’il écrit', () => {
    expect(parseDayInput(formatDayInput('2027-01-31'))).toBe('2027-01-31');
  });
});

describe('dateFromDay / dayFromDate', () => {
  // Le calendrier travaille en dates locales, l'application en jours ISO :
  // l'aller-retour doit tomber sur le même jour quel que soit le fuseau.
  it('fait l’aller-retour entre jour ISO et date locale sans glisser d’un jour', () => {
    expect(dayFromDate(dateFromDay('2026-10-01'))).toBe('2026-10-01');
    expect(dayFromDate(dateFromDay('2026-03-29'))).toBe('2026-03-29');
  });

  it('place la date locale à midi, loin des bascules d’heure d’été', () => {
    expect(dateFromDay('2026-10-01').getHours()).toBe(12);
  });
});
