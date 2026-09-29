import { Schema } from 'effect/index';

import {
  isVehicleType,
  MAX_PHOTOS_PER_LISTING,
} from '../../../domain/entities/Listing';

const VEHICLE_MESSAGE = "Ce type de v\u00e9hicule n'existe pas";
const PHOTOS_MESSAGE = `Une annonce porte de 1 à ${MAX_PHOTOS_PER_LISTING} photos`;

export const PublishListingSchema = Schema.Struct({
  address: Schema.NonEmptyString,
  box: Schema.NonEmptyString,
  accessDescription: Schema.NonEmptyString,
  photos: Schema.Array(Schema.NonEmptyString)
    .annotations({ message: () => PHOTOS_MESSAGE })
    .pipe(Schema.minItems(1))
    .annotations({ message: () => PHOTOS_MESSAGE })
    .pipe(Schema.maxItems(MAX_PHOTOS_PER_LISTING))
    .annotations({ message: () => PHOTOS_MESSAGE }),
  // Facultatif dans le contrat, exigé par le formulaire : les annonces
  // publiées avant cette notion restent valides, et un client tiers qui ne
  // déclare rien obtient « non déclaré » plutôt qu'un refus.
  // Un raffinement unique, et non une union de littéraux : `ArrayFormatter`
  // descend dans chaque membre d'une union et rend leurs messages, soit cinq
  // « Expected "velo", actual "tracteur" » concaténés qui recopient la valeur
  // soumise. Un `filter` ne produit qu'un échec, donc qu'un message — et la
  // maison veut l'annotation sur le type de base *et* sur le raffinement.
  acceptedVehicles: Schema.optionalWith(
    Schema.Array(
      Schema.String.annotations({ message: () => VEHICLE_MESSAGE })
        .pipe(Schema.filter((value) => isVehicleType(value)))
        .annotations({ message: () => VEHICLE_MESSAGE }),
    ).annotations({ message: () => VEHICLE_MESSAGE }),
    { exact: true },
  ),
  pricing: Schema.Struct({
    dayInCents: Schema.optional(Schema.Int),
    weekInCents: Schema.optional(Schema.Int),
    monthInCents: Schema.optional(Schema.Int),
  }),
  availability: Schema.Struct({
    from: Schema.Date,
    to: Schema.Date,
  }),
});
