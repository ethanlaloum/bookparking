export interface RentalPlace {
  address: string;
  box: string;
}

const normalizePlacePart = (part: string): string =>
  part.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();

export const placeKeyOf = (place: RentalPlace): string =>
  JSON.stringify([
    normalizePlacePart(place.address),
    normalizePlacePart(place.box),
  ]);

export const designatesSamePlace = (
  place: RentalPlace,
  other: RentalPlace,
): boolean => placeKeyOf(place) === placeKeyOf(other);
