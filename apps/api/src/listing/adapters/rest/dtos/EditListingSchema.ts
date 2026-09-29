import { Schema } from 'effect/index';

import {
  isVehicleType,
  MAX_PHOTOS_PER_LISTING,
} from '../../../domain/entities/Listing';

const ACCESS_MESSAGE = "Les consignes d'accès sont obligatoires";
const PHOTOS_MESSAGE = `Une annonce porte de 1 à ${MAX_PHOTOS_PER_LISTING} photos`;
const VEHICLE_MESSAGE = "Ce type de véhicule n'existe pas";
const PRICE_MESSAGE = 'Un prix doit être un nombre entier de centimes';
const PRICING_MESSAGE = 'Grille tarifaire invalide';
const DATE_MESSAGE = 'Une date de disponibilité est invalide';
const AVAILABILITY_MESSAGE = 'Période de disponibilité invalide';

const withMessage = (message: string) => ({ message: () => message });

const text = (message: string) =>
  Schema.String.annotations(withMessage(message))
    .pipe(Schema.minLength(1))
    .annotations(withMessage(message));

const priceInCents = Schema.Number.annotations(withMessage(PRICE_MESSAGE))
  .pipe(Schema.int())
  .annotations(withMessage(PRICE_MESSAGE));

const optionalPriceInCents = Schema.optionalWith(priceInCents, {
  exact: true,
});

const day = Schema.String.annotations(withMessage(DATE_MESSAGE))
  .pipe(Schema.compose(Schema.Date.annotations(withMessage(DATE_MESSAGE))))
  .annotations(withMessage(DATE_MESSAGE));

const vehicleType = Schema.String.annotations(withMessage(VEHICLE_MESSAGE))
  .pipe(Schema.filter((value) => isVehicleType(value)))
  .annotations(withMessage(VEHICLE_MESSAGE));

export const EditListingSchema = Schema.Struct({
  accessDescription: text(ACCESS_MESSAGE),
  photos: Schema.Array(text(PHOTOS_MESSAGE))
    .annotations(withMessage(PHOTOS_MESSAGE))
    .pipe(Schema.minItems(1))
    .annotations(withMessage(PHOTOS_MESSAGE))
    .pipe(Schema.maxItems(MAX_PHOTOS_PER_LISTING))
    .annotations(withMessage(PHOTOS_MESSAGE)),
  acceptedVehicles: Schema.Array(vehicleType).annotations(
    withMessage(VEHICLE_MESSAGE),
  ),
  pricing: Schema.Struct({
    dayInCents: optionalPriceInCents,
    weekInCents: optionalPriceInCents,
    monthInCents: optionalPriceInCents,
  }).annotations(withMessage(PRICING_MESSAGE)),
  availability: Schema.Struct({
    from: day,
    to: day,
  }).annotations(withMessage(AVAILABILITY_MESSAGE)),
}).annotations(
  withMessage("Corps de requête invalide pour une modification d'annonce"),
);
