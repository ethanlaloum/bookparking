import { catchError, map, Observable, of } from 'rxjs';

import {
  isPlaceable,
  precisionOfScore,
  type AddressSuggestion,
  type LocatedAddress,
} from '../domain/entities/Coordinates';
import type { GeocodingGateway } from '../domain/ports/GeocodingGateway';

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: { id?: string; label: string; score: number };
}

interface BanResponse {
  features: BanFeature[];
}

/**
 * La Base Adresse Nationale : gratuite, sans clé, et faisant autorité sur les
 * adresses françaises. Elle est appelée depuis le navigateur et non depuis
 * l'api, ce qui est un choix de court terme assumé — le jour où une annonce
 * portera ses coordonnées, cet adaptateur disparaît et le port reste.
 *
 * Un échec réseau rend `null` plutôt que de propager : une carte à laquelle il
 * manque un point reste utile, une carte qui ne s'affiche pas ne l'est pas.
 */
export class BanGeocodingGateway implements GeocodingGateway {
  private static readonly ENDPOINT = 'https://api-adresse.data.gouv.fr/search/';

  // Aucun filtre de commune ni de proximité : le produit couvre toute la
  // France. C'est le code postal et la ville, que le formulaire de publication
  // demande, qui départagent deux rues homonymes — et le score qui dit quand
  // ils manquaient.
  locate(address: string): Observable<LocatedAddress | null> {
    const url = `${BanGeocodingGateway.ENDPOINT}?q=${encodeURIComponent(address)}&limit=1`;

    return this.fetchJson(url).pipe(
      map((response): LocatedAddress | null => {
        const feature = response.features[0];
        if (feature === undefined || !isPlaceable(feature.properties.score)) return null;
        const [longitude, latitude] = feature.geometry.coordinates;
        return {
          coordinates: { latitude, longitude },
          precision: precisionOfScore(feature.properties.score),
          matchedLabel: feature.properties.label,
        };
      }),
      catchError(() => of(null)),
    );
  }

  // `autocomplete=1` fait chercher sur un préfixe plutôt que sur une adresse
  // complète, et les suggestions ne sont pas filtrées par score : c'est
  // l'utilisateur qui choisit, pas un seuil. À l'échelle du pays, « place
  // mass » propose d'abord les places Massenet : c'est la ville tapée qui
  // resserre, et l'aide du champ le dit.
  suggest(query: string): Observable<AddressSuggestion[]> {
    const url =
      `${BanGeocodingGateway.ENDPOINT}?q=${encodeURIComponent(query)}` + `&autocomplete=1&limit=5`;

    return this.fetchJson(url).pipe(
      map((response) =>
        response.features.map((feature, index) => {
          const [longitude, latitude] = feature.geometry.coordinates;
          return {
            id: feature.properties.id ?? `${feature.properties.label}-${String(index)}`,
            label: feature.properties.label,
            coordinates: { latitude, longitude },
          };
        }),
      ),
      catchError(() => of([])),
    );
  }

  private fetchJson(url: string): Observable<BanResponse> {
    return new Observable<BanResponse>((subscriber) => {
      const controller = new AbortController();
      fetch(url, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(String(response.status));
          subscriber.next((await response.json()) as BanResponse);
          subscriber.complete();
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) subscriber.error(error);
        });
      return () => controller.abort();
    });
  }
}
