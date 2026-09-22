import { catchError, map, Observable, of } from 'rxjs';

import {
  isPlaceable,
  NICE,
  NICE_INSEE_CODE,
  precisionOfScore,
  type LocatedAddress,
} from '../domain/entities/Coordinates';
import type { GeocodingGateway } from '../domain/ports/GeocodingGateway';

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: { label: string; score: number };
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

  // `citycode` restreint la recherche à Nice, et la proximité départage deux
  // voies homonymes du même code INSEE. Le produit ne couvrant que Nice, une
  // adresse hors de la commune doit rester non située plutôt que d'atterrir à
  // l'autre bout du pays : c'est ce filtre, et non le score, qui le garantit.
  locate(address: string): Observable<LocatedAddress | null> {
    const url =
      `${BanGeocodingGateway.ENDPOINT}?q=${encodeURIComponent(address)}` +
      `&citycode=${NICE_INSEE_CODE}` +
      `&lat=${String(NICE.latitude)}&lon=${String(NICE.longitude)}` +
      `&limit=1`;

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
    }).pipe(
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
}
