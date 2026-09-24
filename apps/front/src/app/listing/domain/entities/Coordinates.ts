export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationPrecision = 'exact' | 'approximate';

export interface AddressSuggestion {
  id: string;
  label: string;
  coordinates: Coordinates;
}

/**
 * Une place à plus d'un kilomètre d'une adresse cherchée n'est plus « à côté » :
 * à pied, c'est un quart d'heure. Le rayon sert à mettre en avant, jamais à
 * masquer — une carte qui cacherait des places parce qu'elles sont un peu loin
 * ferait croire qu'il n'y en a pas.
 */
export const WALKING_RADIUS_KM = 1;

export interface LocatedAddress {
  coordinates: Coordinates;
  precision: LocationPrecision;
  matchedLabel: string;
}

/**
 * La Base Adresse Nationale rend toujours un résultat, même pour une adresse
 * qui n'existe pas : elle retombe sur la voie la plus proche et le dit par un
 * score. « 12 rue des Lilas 75011 Paris » ressort ainsi en « 12 Rue des Bluets »
 * à 0,61. Placer ce point sans le dire mettrait une voiture dans la mauvaise
 * rue ; l'écarter priverait la carte d'une adresse simplement mal saisie. On
 * garde donc le point et on porte la nuance jusqu'à l'écran.
 */
export const MINIMUM_PLACEABLE_SCORE = 0.5;
export const EXACT_MATCH_SCORE = 0.9;

export const precisionOfScore = (score: number): LocationPrecision =>
  score >= EXACT_MATCH_SCORE ? 'exact' : 'approximate';

export const isPlaceable = (score: number): boolean => score >= MINIMUM_PLACEABLE_SCORE;

/**
 * Bookparking couvre toute la France. C'est ce qui rend un repli légitime : une
 * carte sans aucun point situé s'ouvre sur le pays entier, et non sur une ville
 * qui laisserait croire que le produit s'y arrête. Le centre est celui de la
 * métropole ; le zoom la fait tenir, Corse comprise, même sur un téléphone.
 */
export const FRANCE: Coordinates = { latitude: 46.6, longitude: 2.4 };
export const COUNTRY_ZOOM = 5;
export const CITY_ZOOM = 13;

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const distanceInKilometers = (from: Coordinates, to: Coordinates): number => {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const halfChord =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(halfChord)));
};

/**
 * Le centre est la moyenne des points, pas le premier d'entre eux : une carte
 * cadrée sur une seule annonce laisse toutes les autres hors champ. Sans aucun
 * point, le repli sur la France n'est pas arbitraire — c'est tout ce que le
 * produit couvre.
 */
export const centerOf = (points: readonly Coordinates[]): Coordinates => {
  if (points.length === 0) return FRANCE;
  const total = points.reduce(
    (sum, point) => ({
      latitude: sum.latitude + point.latitude,
      longitude: sum.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: total.latitude / points.length,
    longitude: total.longitude / points.length,
  };
};

export const spanInKilometers = (points: readonly Coordinates[]): number => {
  if (points.length < 2) return 0;
  let widest = 0;
  for (let i = 0; i < points.length; i += 1)
    for (let j = i + 1; j < points.length; j += 1)
      widest = Math.max(widest, distanceInKilometers(points[i], points[j]));
  return widest;
};

/**
 * Un niveau de zoom qui laisse la dispersion tenir à l'écran. Les paliers sont
 * grossiers volontairement : ajuster finement demanderait la taille du
 * conteneur, que le domaine n'a pas et ne doit pas avoir. Chacun montre à peu
 * près le double de l'écart qu'il cadre, d'un quartier jusqu'au pays ; au-delà,
 * les places sont de part et d'autre d'un océan — l'outre-mer est en France.
 */
export const zoomForSpan = (spanKm: number): number => {
  if (spanKm === 0) return CITY_ZOOM;
  if (spanKm < 2) return 14;
  if (spanKm < 6) return CITY_ZOOM;
  if (spanKm < 15) return 11;
  if (spanKm < 30) return 10;
  if (spanKm < 60) return 9;
  if (spanKm < 120) return 8;
  if (spanKm < 250) return 7;
  if (spanKm < 500) return 6;
  if (spanKm < 1300) return COUNTRY_ZOOM;
  return 2;
};

export interface MapFrame {
  center: Coordinates;
  zoom: number;
}

/**
 * Sans aucun point, la carte montre tout le pays : au zoom d'une rue, le centre
 * de la France n'est qu'un champ du Cher.
 */
export const frameOf = (points: readonly Coordinates[]): MapFrame => ({
  center: centerOf(points),
  zoom: points.length === 0 ? COUNTRY_ZOOM : zoomForSpan(spanInKilometers(points)),
});

export const isWithinWalkingDistance = (from: Coordinates, to: Coordinates): boolean =>
  distanceInKilometers(from, to) <= WALKING_RADIUS_KM;

export const formatDistance = (kilometers: number): string =>
  kilometers < 1
    ? `${String(Math.round(kilometers * 1000))} m`
    : `${kilometers.toFixed(1).replace('.', ',')} km`;
