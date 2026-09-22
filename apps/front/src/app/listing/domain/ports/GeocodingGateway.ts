import type { Observable } from 'rxjs';

import type { AddressSuggestion, LocatedAddress } from '../entities/Coordinates';

export interface GeocodingGateway {
  // Rend `null` quand aucun résultat n'atteint le score minimal : une adresse
  // qu'on ne sait pas placer n'est pas une erreur, c'est une absence.
  locate(address: string): Observable<LocatedAddress | null>;
  // Rend une liste ordonnée par pertinence, vide plutôt qu'en erreur : une
  // frappe sans résultat n'est pas un échec, c'est une frappe en cours.
  suggest(query: string): Observable<AddressSuggestion[]>;
}
