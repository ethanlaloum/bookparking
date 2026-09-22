import { Schema } from 'effect/index';

export const RequestRentalSchema = Schema.Struct({
  address: Schema.String.annotations({ message: () => 'Adresse invalide' }),
  box: Schema.String.annotations({ message: () => 'Numéro de box invalide' }),
  fromDay: Schema.String.annotations({
    message: () => 'Date de début invalide',
  }),
  toDay: Schema.String.annotations({ message: () => 'Date de fin invalide' }),
}).annotations({
  message: () => 'Corps de requête invalide pour une demande de location',
});
