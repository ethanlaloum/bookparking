import { Schema } from 'effect/index';

export const PublishListingSchema = Schema.Struct({
  address: Schema.NonEmptyString,
  box: Schema.NonEmptyString,
  accessDescription: Schema.NonEmptyString,
  photos: Schema.Array(Schema.NonEmptyString).pipe(Schema.minItems(1)),
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
