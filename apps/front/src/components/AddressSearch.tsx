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
import { Button } from './ui/button';

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
     * La colonne fait exactement la même hauteur que celles des sélecteurs :
     * un libellé, puis un contrôle. L'aide et l'adresse retenue sont rendues
     * par l'appelant sous la barre entière — les garder ici faisait grandir
     * cette seule colonne dès que le texte passait sur deux lignes, et
     * désalignait toute la rangée.
     */
    <div ref={containerRef} className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-fg">
        {t('mapSearch.label')}
      </label>

      <div className="flex min-w-0 gap-2">
        {/* Ancre de la liste : elle se pose sous l'entrée, sans décalage codé en dur. */}
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
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
            className="min-h-11 w-full rounded-[2px] border border-line-strong bg-bg-raised pr-3 pl-9 text-fg placeholder:text-fg-subtle transition-colors duration-150 focus:border-accent"
          />

          <ul
            id={listId}
            role="listbox"
            aria-label={t('mapSearch.suggestions')}
            hidden={!expanded}
            className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-[2px] border border-line-strong bg-bg-raised shadow-[var(--shadow-lift)]"
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
                  'flex cursor-pointer items-center gap-2 px-3.5 py-2.5 text-sm',
                  index === highlighted ? 'bg-accent text-on-accent' : 'text-fg',
                )}
              >
                <MapPin
                  className={cn('size-4 shrink-0', index === highlighted ? '' : 'text-accent')}
                  aria-hidden="true"
                />
                {suggestion.label}
              </li>
            ))}
          </ul>
        </div>

        {(value !== null || query !== '') && (
          <Button
            type="button"
            variant="outline"
            onClick={clear}
            aria-label={t('mapSearch.clear')}
            className="shrink-0"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
};
