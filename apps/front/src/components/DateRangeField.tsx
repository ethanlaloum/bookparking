import { ArrowRight, CalendarDays, CircleAlert } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '../hooks/useMediaQuery';
import { dateFromDay, dayFromDate, formatDayInput, parseDayInput } from '../lib/calendarDay';
import { cn } from '../lib/cn';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';

type End = 'from' | 'to';

export interface DayRange {
  from: string;
  to: string;
}

interface DateRangeFieldProps {
  labels: Record<End, string>;
  value: DayRange;
  onChange: (next: DayRange) => void;
  /** Premier et dernier jours ISO sélectionnables. */
  min?: string;
  max?: string;
  errors?: Partial<Record<End, string>>;
  inputRefs?: Partial<Record<End, Ref<HTMLInputElement>>>;
  onBlur?: Partial<Record<End, () => void>>;
  /** `joined` : un seul cadre, comme un billet ; `split` : deux champs côte à côte. */
  variant: 'joined' | 'split';
  /** Nombre de mois affichés sur un écran large — un seul, toujours, sur mobile. */
  months?: 1 | 2;
  /**
   * `below` : sous les champs. `side` : à gauche du composant sur grand écran —
   * pour une carte collante, où un calendrier ouvert vers le bas sortirait de
   * l'écran sans que la page puisse défiler pour le montrer.
   */
  placement?: 'below' | 'side';
}

const ENDS: readonly End[] = ['from', 'to'];

const assignRef = <T,>(ref: Ref<T> | undefined, value: T | null): void => {
  if (typeof ref === 'function') ref(value);
  else if (ref !== null && ref !== undefined) ref.current = value;
};

/**
 * Deux champs de date et un seul calendrier, qui montre la période entière.
 *
 * Les champs restent des `<input>` où l'on tape `jj/mm/aaaa` — ou un jour ISO,
 * ce que fait `fill()` dans le barreau e2e — et chacun garde son `<label>` : le
 * nom accessible est le contrat. Le calendrier est une facilité, jamais le
 * seul chemin. On y choisit le début puis la fin ; cliquer un jour avant le
 * début recommence la période plutôt que d'en produire une à l'envers.
 */
export const DateRangeField = ({
  labels,
  value,
  onChange,
  min,
  max,
  errors = {},
  inputRefs = {},
  onBlur = {},
  variant,
  months = 1,
  placement = 'below',
}: DateRangeFieldProps) => {
  const { t, i18n } = useTranslation('common');
  const uid = useId();
  const wide = useMediaQuery('(min-width: 640px)');
  const beside = useMediaQuery('(min-width: 1024px)') && placement === 'side';

  const [open, setOpen] = useState<End | null>(null);
  const [focusGrid, setFocusGrid] = useState(false);
  const [month, setMonth] = useState<Date>(() => new Date());
  const [drafts, setDrafts] = useState<Record<End, string | null>>({ from: null, to: null });
  const [hovered, setHovered] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputs = useRef<Record<End, HTMLInputElement | null>>({ from: null, to: null });

  const ids = {
    from: { input: `${uid}-from`, label: `${uid}-from-label`, error: `${uid}-from-error` },
    to: { input: `${uid}-to`, label: `${uid}-to-label`, error: `${uid}-to-error` },
  };

  useEffect(() => {
    if (open === null) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  // Sur le côté, le calendrier se centre sur les champs, mais sans passer
  // sous l'en-tête collant ni sortir par le bas : la carte qui le porte est
  // collée elle aussi, et la page ne défilerait pas pour le montrer. La
  // position s'écrit directement sur le nœud — aucune donnée de rendu n'en
  // dépend, et un `setState` ici relancerait un rendu pour rien.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const root = rootRef.current;
    if (!beside || open === null || dialog === null || root === null) return;
    const anchor = root.getBoundingClientRect();
    const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    const margin = 12;
    const centred = anchor.top + anchor.height / 2 - dialog.offsetHeight / 2;
    const lowest = window.innerHeight - dialog.offsetHeight - margin;
    const top = Math.max(Math.min(centred, lowest), headerBottom + margin);
    dialog.style.top = `${String(top - anchor.top)}px`;
  }, [beside, open, month]);

  const shortDate = new Intl.DateTimeFormat(i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const firstSelectable = (end: End): string | undefined => {
    const floor = min ?? '';
    if (end === 'to' && value.from !== '' && value.from > floor) return value.from;
    return floor === '' ? undefined : floor;
  };

  const openOn = (end: End, withKeyboard: boolean): void => {
    const shown = value[end] !== '' ? value[end] : (value.from !== '' ? value.from : firstSelectable(end));
    setMonth(shown === undefined ? new Date() : dateFromDay(shown));
    setFocusGrid(withKeyboard);
    setOpen(end);
  };

  const close = (returnFocusTo?: End): void => {
    setOpen(null);
    if (returnFocusTo !== undefined) inputs.current[returnFocusTo]?.focus();
  };

  // Changer le début après la fin effacerait une période à l'envers : la fin
  // tombe, et c'est à l'utilisateur de la redonner.
  const commit = (end: End, day: string): void => {
    if (end === 'from') onChange({ from: day, to: value.to !== '' && day !== '' && value.to < day ? '' : value.to });
    else onChange({ from: value.from, to: day });
  };

  const pick = (date: Date): void => {
    const day = dayFromDate(date);
    setDrafts({ from: null, to: null });
    if (open === 'from' || (open === 'to' && value.from !== '' && day < value.from)) {
      onChange({ from: day, to: value.to !== '' && value.to >= day ? value.to : '' });
      setOpen('to');
      return;
    }
    onChange({ from: value.from, to: day });
    close('to');
  };

  const onType = (end: End, text: string): void => {
    setDrafts((current) => ({ ...current, [end]: text }));
    const day = parseDayInput(text);
    if (day !== null) commit(end, day);
    else if (text.trim() === '') commit(end, '');
  };

  // À la sortie du champ, la saisie se relit sous sa forme canonique — ou
  // revient à la dernière date valide si elle n'en était pas une.
  const onInputBlur = (end: End): void => {
    setDrafts((current) => ({ ...current, [end]: null }));
    onBlur[end]?.();
  };

  const onInputKeyDown = (end: End, event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown' || (event.altKey && event.key === 'ArrowDown')) {
      event.preventDefault();
      openOn(end, true);
    }
  };

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape' && open !== null) {
      event.preventDefault();
      close(open);
    }
  };

  // Quitter le composant au clavier referme le calendrier. Un `relatedTarget`
  // nul — un clic dans une zone vide du calendrier — ne compte pas comme une
  // sortie.
  const onRootBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget;
    if (open !== null && next !== null && !rootRef.current?.contains(next)) setOpen(null);
  };

  // Pendant qu'on choisit la fin, la période se dessine jusqu'au jour survolé :
  // on voit ce qu'on va réserver avant de cliquer.
  const previewing =
    open === 'to' && hovered !== null && value.from !== '' && hovered >= value.from;
  const shownTo = previewing ? hovered : value.to;
  const from = value.from === '' ? undefined : dateFromDay(value.from);
  const to = shownTo === '' ? undefined : dateFromDay(shownTo);
  const chosenTo = value.to === '' ? undefined : dateFromDay(value.to);
  const floor = open === null ? undefined : firstSelectable(open);
  const joined = variant === 'joined';
  const shownMonths = wide || beside ? months : 1;

  const cell = (end: End) => {
    const error = errors[end];
    const active = open === end;
    const input = (
      <input
        ref={(element) => {
          inputs.current[end] = element;
          assignRef(inputRefs[end], element);
        }}
        id={ids[end].input}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={t('date.placeholder')}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : ids[end].error}
        value={drafts[end] ?? formatDayInput(value[end])}
        onChange={(event) => onType(end, event.target.value)}
        onClick={() => {
          if (open !== end) openOn(end, false);
        }}
        onBlur={() => onInputBlur(end)}
        onKeyDown={(event) => onInputKeyDown(end, event)}
        className={cn(
          'tabular w-full min-w-0 flex-1 bg-transparent font-medium text-fg placeholder:font-normal placeholder:text-fg-subtle focus-visible:outline-none',
          joined ? 'min-h-8' : 'min-h-11',
        )}
      />
    );
    const toggle = (
      <button
        type="button"
        aria-label={t('date.openCalendar')}
        aria-describedby={ids[end].label}
        aria-haspopup="dialog"
        aria-expanded={active}
        onClick={() => (active ? close(end) : openOn(end, true))}
        className={cn(
          'grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors',
          active ? 'bg-brand text-on-brand' : 'text-fg-subtle hover:bg-bg-sunken hover:text-fg',
        )}
      >
        <CalendarDays className="size-4" aria-hidden="true" />
      </button>
    );

    if (joined)
      return (
        <div
          key={end}
          className={cn(
            'flex min-w-0 flex-col gap-0.5 py-2.5 pr-2 pl-4 transition-colors',
            end === 'to' && 'border-l border-line-strong',
            active && 'bg-accent-soft',
          )}
        >
          <label id={ids[end].label} htmlFor={ids[end].input} className="label-ticket text-fg-subtle">
            {labels[end]}
          </label>
          <div className="flex items-center gap-1">
            {input}
            {toggle}
          </div>
        </div>
      );

    return (
      <div key={end} className="flex min-w-0 flex-col gap-2">
        <label id={ids[end].label} htmlFor={ids[end].input} className="text-sm font-medium text-fg">
          {labels[end]}
        </label>
        <div
          className={cn(
            'flex items-center gap-1 rounded-xl border bg-bg-raised pr-1.5 pl-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/25',
            error === undefined ? 'border-line-strong hover:border-fg-subtle' : 'border-danger',
            active && 'border-accent ring-[3px] ring-accent/25',
          )}
        >
          {input}
          {toggle}
        </div>
        {error !== undefined && (
          <p id={ids[end].error} className="flex items-center gap-1.5 text-xs font-medium text-danger">
            <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onRootKeyDown} onBlur={onRootBlur}>
      {joined ? (
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line-strong transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/25">
          {ENDS.map(cell)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{ENDS.map(cell)}</div>
      )}

      {open !== null && (
        // Sur un téléphone, une feuille qui monte du bas de l'écran : un
        // calendrier ancré sous un champ y déborderait de la largeur.
        <div
          aria-hidden="true"
          className="animate-fade fixed inset-0 z-40 bg-asphalt-950/55 backdrop-blur-[2px] sm:hidden"
          onClick={() => close(open)}
        />
      )}

      {open !== null && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label={t('date.dialog')}
          className={cn(
            'animate-rise fixed inset-x-3 bottom-3 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl border border-line bg-bg-raised p-4 shadow-[var(--shadow-float)] [--i:0]',
            'sm:absolute sm:inset-x-auto sm:bottom-auto sm:z-40 sm:max-h-none sm:w-max sm:overflow-visible sm:p-5',
            beside ? 'sm:right-[calc(100%+3rem)]' : 'sm:top-full sm:left-0 sm:mt-2',
          )}
        >
          {/* Les deux bouts de la période : celui qu'on choisit est allumé,
              et l'on peut passer de l'un à l'autre. */}
          <div className="mb-3 flex items-center gap-2">
            {ENDS.map((end, index) => (
              <div key={end} className="flex min-w-0 flex-1 items-center gap-2">
                {index === 1 && <ArrowRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />}
                <button
                  type="button"
                  aria-pressed={open === end}
                  onClick={() => setOpen(end)}
                  className={cn(
                    'flex min-w-0 flex-1 cursor-pointer flex-col items-start rounded-xl border px-3 py-1.5 text-left transition-colors',
                    open === end
                      ? 'border-brand bg-accent-soft'
                      : 'border-line hover:border-line-strong hover:bg-bg-sunken',
                  )}
                >
                  <span className="label-ticket text-fg-subtle">{labels[end]}</span>
                  <span className="truncate text-sm font-semibold text-fg">
                    {value[end] === '' ? t('date.empty') : shortDate.format(dateFromDay(value[end]))}
                  </span>
                </button>
              </div>
            ))}
          </div>

          <Calendar
            className="mx-auto w-fit"
            mode="range"
            // `selected` ne suit que les dates choisies : l'aperçu au survol se
            // dessine, il ne s'annonce pas comme une sélection.
            selected={{ from, to: chosenTo }}
            onSelect={(_range, triggerDate) => pick(triggerDate)}
            onDayMouseEnter={(date) => setHovered(dayFromDate(date))}
            onDayMouseLeave={() => setHovered(null)}
            month={month}
            onMonthChange={setMonth}
            numberOfMonths={shownMonths}
            // Sur deux mois, les jours hors du mois apparaîtraient deux fois — et
            // la période se colorerait deux fois avec eux.
            showOutsideDays={shownMonths === 1}
            autoFocus={focusGrid}
            startMonth={min === undefined ? undefined : dateFromDay(min)}
            endMonth={max === undefined ? undefined : dateFromDay(max)}
            disabled={[
              ...(floor === undefined ? [] : [{ before: dateFromDay(floor) }]),
              ...(max === undefined ? [] : [{ after: dateFromDay(max) }]),
            ]}
            modifiers={{
              start: from === undefined ? [] : from,
              end: to === undefined ? [] : to,
              between:
                from !== undefined && to !== undefined ? { after: from, before: to } : [],
            }}
            modifiersClassNames={{
              between: 'bg-accent-soft [&>button]:rounded-none [&>button]:hover:bg-accent-soft',
              start: cn(
                '[&>button]:bg-brand [&>button]:text-on-brand [&>button]:shadow-[var(--shadow-brand)] [&>button]:hover:bg-brand-hover',
                to !== undefined &&
                  shownTo !== value.from &&
                  'bg-[linear-gradient(to_right,transparent_50%,var(--accent-soft)_50%)]',
              ),
              end: cn(
                previewing
                  ? '[&>button]:ring-2 [&>button]:ring-brand [&>button]:ring-inset'
                  : '[&>button]:bg-brand [&>button]:text-on-brand [&>button]:shadow-[var(--shadow-brand)] [&>button]:hover:bg-brand-hover',
                from !== undefined &&
                  shownTo !== value.from &&
                  'bg-[linear-gradient(to_left,transparent_50%,var(--accent-soft)_50%)]',
              ),
            }}
          />

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            <p className="text-xs text-fg-subtle" aria-live="polite">
              {t('date.picking', { label: labels[open] })}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDrafts({ from: null, to: null });
                  onChange({ from: '', to: '' });
                  setOpen('from');
                }}
              >
                {t('date.clear')}
              </Button>
              <Button type="button" size="sm" onClick={() => close(open)}>
                {t('date.done')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
