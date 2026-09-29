import type { VehicleType } from '../app/listing/domain/entities/SearchCriteria';
import {
  storedPhotoDraftsOf,
  type ListingContentDraft,
  type PhotoDraft,
} from '../app/listing/domain/entities/ListingPhoto';
import type { OwnerListing } from '../app/listing/domain/ports/ListingGateway';
import { centsFromInput, inputFromCents } from './format';

export interface ListingFormValues {
  address: string;
  box: string;
  accessDescription: string;
  photos: PhotoDraft[];
  acceptedVehicles: VehicleType[];
  dayInCents: string;
  weekInCents: string;
  monthInCents: string;
  from: string;
  to: string;
}

export const EMPTY_LISTING_FORM: ListingFormValues = {
  address: '',
  box: '',
  accessDescription: '',
  photos: [],
  acceptedVehicles: [],
  dayInCents: '',
  weekInCents: '',
  monthInCents: '',
  from: '',
  to: '',
};

const midnightUtcOf = (day: string): string => new Date(`${day}T00:00:00.000Z`).toISOString();

export const listingFormValuesOf = (listing: OwnerListing): ListingFormValues => ({
  address: listing.address,
  box: listing.box,
  accessDescription: listing.accessDescription,
  photos: storedPhotoDraftsOf(listing.photos),
  acceptedVehicles: [...listing.acceptedVehicles],
  dayInCents: inputFromCents(listing.pricing.dayInCents),
  weekInCents: inputFromCents(listing.pricing.weekInCents),
  monthInCents: inputFromCents(listing.pricing.monthInCents),
  from: listing.availability.from.slice(0, 10),
  to: listing.availability.to.slice(0, 10),
});

export const listingContentOf = (values: ListingFormValues): ListingContentDraft => ({
  accessDescription: values.accessDescription.trim(),
  photos: values.photos,
  acceptedVehicles: values.acceptedVehicles,
  pricing: {
    dayInCents: centsFromInput(values.dayInCents),
    weekInCents: centsFromInput(values.weekInCents),
    monthInCents: centsFromInput(values.monthInCents),
  },
  availability: { from: midnightUtcOf(values.from), to: midnightUtcOf(values.to) },
});
