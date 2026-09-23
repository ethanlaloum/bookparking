/**
 * Les trois colonnes de `SearchBar` — l'adresse, le véhicule, la durée — ont
 * la même forme : un libellé, puis un contrôle. Empilées sur mobile, ce sont
 * trois champs encadrés ; à partir de `lg`, ce sont trois segments d'une même
 * barre, sans bordure propre, que le survol et le focus éclairent en entier.
 * Les classes vivent ici pour que `AddressSearch` et `SearchBar` ne puissent
 * pas diverger d'un pixel.
 */
export const SEGMENT =
  'relative flex min-w-0 flex-col gap-2 lg:gap-0.5 lg:rounded-xl lg:px-4 lg:py-2.5 lg:transition-colors lg:duration-150 lg:hover:bg-bg-sunken lg:has-[:focus-visible]:bg-bg-sunken lg:has-[:focus-visible]:ring-2 lg:has-[:focus-visible]:ring-accent';

/** Le trait qui sépare deux segments, masqué sur mobile. */
export const DIVIDER =
  'lg:before:absolute lg:before:inset-y-3 lg:before:left-0 lg:before:w-px lg:before:bg-line';

export const LABEL = 'text-sm font-medium text-fg lg:label-ticket lg:text-fg-subtle';

export const CONTROL =
  'min-h-12 w-full rounded-xl border border-line-strong bg-bg-raised text-fg transition-[border-color,box-shadow] duration-150 hover:border-fg-subtle focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/25 focus-visible:outline-none lg:min-h-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:text-[0.95rem] lg:font-medium lg:focus-visible:ring-0';
