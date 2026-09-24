import { MapPin, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AddressSuggestion } from '../app/listing/domain/entities/Coordinates';
import type { SearchedAddress } from '../app/listing/domain/entities/SearchCriteria';
import {
  addressQueryChanged,
  MINIMUM_QUERY_LENGTH,
} from '../app/listing/domain/use-cases/search-address/searchAddressEpic';
import { cn } from '../lib/cn';
import { selectAddressSuggestions } from '../selectors/listing/listingSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { CONTROL, LABEL, SEGMENT } from './searchFieldStyles';

/**
 * Le motif ARIA du combobox, suivi à la lettre : `role="combobox"` sur l'entrée,
 * `aria-expanded`, `aria-controls` vers la liste, et `aria-activedescendant`
 * qui désigne l'option survolée au clavier **sans** lui donner le focus — c'est
 * ce qui laisse la frappe continuer pendant qu'on parcourt les suggestions.
 * Sans ce motif, un lecteur d'écran n'annonce jamais qu'une liste s'est
 * ouverte, et aucun test ne peut désigner une option par son nom.
 */
interface AddressSearchProps {
  value: SearchedAddress | null;
  onChoose: (address: SearchedAddress | null) => void;
  /** Rendu par l'appelant, sous la barre — voir le bloc de rendu ci-dessous. */
  onQueryStateChange?: (state: { tooShort: boolean }) => void;
}

export const AddressSearch = ({ value, onChoose, onQueryStateChange }: AddressSearchProps) => {
  const { t } = useTranslation('listing');
  const dispatch = useAppDispatch();

  const suggestions = useAppSelector(selectAddressSuggestions);

  const [query, setQuery] = useState(value?.label ?? '');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const inputId = useId();
  const listId = `${inputId}-listbox`;
  const hintId = `${inputId}-hint`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const choose = (suggestion: AddressSuggestion): void => {
    onChoose({ label: suggestion.label, coordinates: suggestion.coordinates });
    setQuery(suggestion.label);
    setOpen(false);
    setHighlighted(-1);
  };

  const clear = (): void => {
    onChoose(null);
    setQuery('');
    setOpen(false);
    setHighlighted(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlighted((index) => (index + 1) % suggestions.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    }
    if (event.key === 'Enter' && highlighted >= 0) {
      event.preventDefault();
      choose(suggestions[highlighted]);
    }
  };

  const expanded = open && suggestions.length > 0;

  return (
    /*
     * La colonne a exactement la même forme que celles des sélecteurs : un
     * libellé, puis un contrôle. L'aide et l'adresse retenue sont rendues par
     * l'appelant sous la barre entière — les garder ici faisait grandir cette
     * seule colonne dès que le texte passait sur deux lignes, et désalignait
     * toute la rangée.
     */
    <div ref={containerRef} className={SEGMENT}>
      <label htmlFor={inputId} className={LABEL}>
        {t('mapSearch.label')}
      </label>

      {/* Ancre de la liste : elle se pose sous l'entrée, sans décalage codé en dur. */}
      <div className="relative min-w-0">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle lg:left-0 lg:text-accent"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-describedby={hintId}
          aria-activedescendant={
            highlighted >= 0 ? `${listId}-option-${String(highlighted)}` : undefined
          }
          placeholder={t('mapSearch.placeholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlighted(-1);
            onQueryStateChange?.({
              tooShort:
                event.target.value.trim().length > 0 &&
                event.target.value.trim().length < MINIMUM_QUERY_LENGTH,
            });
            dispatch(addressQueryChanged({ query: event.target.value }));
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(CONTROL, 'truncate pr-11 pl-10 placeholder:text-fg-subtle lg:pl-6')}
        />

        {(value !== null || query !== '') && (
          <button
            type="button"
            onClick={clear}
            aria-label={t('mapSearch.clear')}
            title={t('mapSearch.clear')}
            className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-bg-sunken hover:text-fg lg:right-0 lg:size-8 lg:hover:bg-bg-raised"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}

        <ul
          id={listId}
          role="listbox"
          aria-label={t('mapSearch.suggestions')}
          hidden={!expanded}
          className="animate-fade absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-bg-raised p-1.5 shadow-[var(--shadow-float)] lg:-inset-x-4 lg:mt-4"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${listId}-option-${String(index)}`}
              role="option"
              aria-selected={index === highlighted}
              onMouseEnter={() => setHighlighted(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(suggestion);
              }}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-fg transition-colors',
                index === highlighted && 'bg-bg-sunken',
              )}
            >
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-lg transition-colors',
                  index === highlighted ? 'bg-brand text-on-brand' : 'bg-accent-soft text-accent',
                )}
              >
                <MapPin className="size-4" aria-hidden="true" />
              </span>
              {suggestion.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
