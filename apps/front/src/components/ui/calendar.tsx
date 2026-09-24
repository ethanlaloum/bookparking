import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type ChevronProps, type DayPickerProps } from 'react-day-picker';
import { enUS, fr } from 'react-day-picker/locale';
import { useTranslation } from 'react-i18next';

import { cn } from '../../lib/cn';

const Chevron = ({ orientation, className }: ChevronProps) =>
  orientation === 'left' ? (
    <ChevronLeft className={cn('size-4', className)} aria-hidden="true" />
  ) : (
    <ChevronRight className={cn('size-4', className)} aria-hidden="true" />
  );

// Aucune feuille de style de react-day-picker n'est importée : chaque partie
// reçoit ses classes d'ici, avec les jetons du système. Les états (aujourd'hui,
// désactivé, hors du mois) sont posés sur la cellule, d'où les sélecteurs
// `[&>button]` qui atteignent le bouton qu'elle contient.
const CLASS_NAMES = {
  root: 'relative',
  months: 'flex flex-col gap-6 sm:flex-row',
  month: 'flex flex-col gap-3',
  month_caption: 'flex h-9 items-center justify-center',
  caption_label: 'font-display text-base font-semibold capitalize text-fg',
  nav: 'pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between',
  button_previous:
    'pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-xl text-fg-muted transition-colors hover:bg-bg-sunken hover:text-fg disabled:pointer-events-none disabled:opacity-30',
  button_next:
    'pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-xl text-fg-muted transition-colors hover:bg-bg-sunken hover:text-fg disabled:pointer-events-none disabled:opacity-30',
  month_grid: 'border-collapse',
  weekdays: '',
  weekday: 'label-ticket h-8 w-9 text-center font-normal text-fg-subtle sm:w-10',
  weeks: '',
  week: '',
  day: 'p-0 text-center',
  day_button:
    'relative mx-auto grid size-9 cursor-pointer place-items-center rounded-xl text-sm font-medium text-fg transition-[background-color,color,box-shadow] duration-150 hover:bg-bg-sunken sm:size-10',
  today:
    '[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-accent',
  outside: '[&>button]:text-fg-subtle/60',
  disabled:
    '[&>button]:cursor-not-allowed [&>button]:text-fg-subtle/40 [&>button]:hover:bg-transparent',
  hidden: 'invisible',
  // Les états de sélection sont dessinés par l'appelant (voir DateRangeField),
  // qui sait lequel des deux bouts de la période on est en train de choisir.
  selected: '',
  range_start: '',
  range_middle: '',
  range_end: '',
  focused: '',
  chevron: '',
};

export const Calendar = ({ className, classNames, ...props }: DayPickerProps) => {
  const { t, i18n } = useTranslation('common');
  const french = i18n.language.startsWith('fr');
  const fullDate = new Intl.DateTimeFormat(french ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <DayPicker
      locale={french ? fr : enUS}
      weekStartsOn={1}
      showOutsideDays
      labels={{
        labelNext: () => t('date.nextMonth'),
        labelPrevious: () => t('date.previousMonth'),
        labelDayButton: (date, modifiers) =>
          `${fullDate.format(date)}${modifiers.selected ? t('date.selectedSuffix') : ''}`,
      }}
      components={{ Chevron }}
      className={cn(className)}
      classNames={{ ...CLASS_NAMES, ...classNames }}
      {...props}
    />
  );
};
