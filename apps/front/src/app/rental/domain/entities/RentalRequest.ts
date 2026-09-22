import { dayCountOf, type CalendarDay } from '../../../listing/domain/entities/Listing';

export const MAX_RENTAL_DAYS = 366;

export type RequestedPeriodProblem = 'incomplete' | 'reversed' | 'past' | 'too-long';

export interface RequestedPeriod {
  fromDay: CalendarDay;
  toDay: CalendarDay;
}

/**
 * Les quatre refus que l'api oppose à une période, vérifiés avant l'envoi pour
 * que le locataire les voie dans le formulaire plutôt qu'en 422. L'api reste
 * l'autorité : ceci ne fait qu'éviter un aller-retour.
 */
export const problemWithRequestedPeriod = (
  period: Partial<RequestedPeriod>,
  today: CalendarDay,
): RequestedPeriodProblem | null => {
  const { fromDay, toDay } = period;
  if (fromDay === undefined || toDay === undefined || fromDay === '' || toDay === '')
    return 'incomplete';
  if (toDay < fromDay) return 'reversed';
  if (fromDay < today) return 'past';
  if (dayCountOf(fromDay, toDay) > MAX_RENTAL_DAYS) return 'too-long';
  return null;
};
