import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { cn } from '../../lib/cn';

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  icon?: LucideIcon;
}

interface SelectProps<V extends string> {
  /** Identifiant du déclencheur : c'est lui que vise le `htmlFor` du libellé. */
  id: string;
  /** Identifiant du libellé visible, qui nomme le déclencheur et la liste. */
  labelId: string;
  value: V;
  options: readonly SelectOption<V>[];
  onChange: (value: V) => void;
  className?: string;
  listClassName?: string;
}

const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr-FR');

/**
 * Une liste déroulante qui n'est plus le menu natif du système, et qui garde
 * pourtant tout ce qu'il savait faire. Le motif ARIA « select-only combobox »,
 * suivi à la lettre : le focus reste sur le déclencheur, `aria-activedescendant`
 * désigne l'option parcourue, et le clavier fait ce qu'il faisait avec un
 * `<select>` — flèches, Début, Fin, Entrée, Espace, Échap, Tab, et la frappe
 * d'une lettre qui saute à l'option correspondante.
 */
export const Select = <V extends string>({
  id,
  labelId,
  value,
  options,
  onChange,
  className,
  listClassName,
}: SelectProps<V>) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const listId = `${id}-listbox`;
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const selected = options[selectedIndex];
  const last = options.length - 1;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  const openAt = (index: number): void => {
    setActive(index);
    setOpen(true);
  };

  const commit = (index: number): void => {
    const option = options[index];
    if (option !== undefined) onChange(option.value);
    setOpen(false);
  };

  // La frappe s'accumule tant qu'on tape vite : « vo » saute à « Voiture »,
  // « voiture e » à « Voiture électrique ». Une pause d'une demi-seconde repart
  // de zéro, comme dans un menu natif.
  const jumpTo = (character: string): void => {
    const now = Date.now();
    typed.current = {
      text: now - typed.current.at > 500 ? character : typed.current.text + character,
      at: now,
    };
    const wanted = normalize(typed.current.text);
    const match = options.findIndex((option) => normalize(option.label).startsWith(wanted));
    if (match >= 0) openAt(match);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openAt(selectedIndex);
        else setActive((index) => Math.min(index + 1, last));
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openAt(selectedIndex);
        else if (event.altKey) commit(active);
        else setActive((index) => Math.max(index - 1, 0));
        return;
      case 'Home':
        event.preventDefault();
        openAt(0);
        return;
      case 'End':
        event.preventDefault();
        openAt(last);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) commit(active);
        else openAt(selectedIndex);
        return;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        return;
      case 'Tab':
        if (open) commit(active);
        return;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey)
          jumpTo(event.key);
    }
  };

  const SelectedIcon = selected?.icon;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${String(active)}` : undefined}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={onKeyDown}
        className={cn('flex cursor-pointer items-center gap-2.5 text-left', className)}
      >
        {SelectedIcon !== undefined && (
          <SelectedIcon className="size-4 shrink-0 text-accent" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-fg-subtle transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        tabIndex={-1}
        hidden={!open}
        className={cn(
          'animate-fade absolute top-full left-0 z-40 mt-2 w-max max-w-[calc(100vw-2rem)] min-w-full overflow-hidden rounded-2xl border border-line bg-bg-raised p-1.5 shadow-[var(--shadow-float)]',
          listClassName,
        )}
      >
        {options.map((option, index) => {
          const Icon = option.icon;
          const isSelected = option.value === value;
          return (
            <li
              key={option.value}
              id={`${listId}-${String(index)}`}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setActive(index)}
              // Le clic ne doit pas voler le focus au déclencheur : c'est lui
              // qui porte `aria-activedescendant`, et Échap doit y ramener.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commit(index)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl py-2 pr-3 pl-2 text-sm text-fg transition-colors',
                index === active && 'bg-bg-sunken',
              )}
            >
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-lg transition-colors',
                  isSelected ? 'bg-brand text-on-brand' : 'bg-accent-soft text-accent',
                )}
              >
                {Icon !== undefined && <Icon className="size-4" aria-hidden="true" />}
              </span>
              <span className={cn('flex-1 whitespace-nowrap', isSelected && 'font-semibold')}>
                {option.label}
              </span>
              <Check
                className={cn('size-4 shrink-0 text-accent', !isSelected && 'invisible')}
                aria-hidden="true"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
