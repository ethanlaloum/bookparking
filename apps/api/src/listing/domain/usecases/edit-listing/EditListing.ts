import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Listing, ListingEdition } from '../../entities/Listing';
import { ActiveListingNotFoundError } from '../../errors/ActiveListingNotFoundError';
import { AvailabilityPeriodExpiredError } from '../../errors/AvailabilityPeriodExpiredError';
import { IncompletePricingError } from '../../errors/IncompletePricingError';
import { ListingNotOwnedError } from '../../errors/ListingNotOwnedError';
import { UnknownPhotoError } from '../../errors/UnknownPhotoError';
import { UnknownVehicleTypeError } from '../../errors/UnknownVehicleTypeError';
import { ListingRepository } from '../../ports/ListingRepository';
import { PhotoStorage } from '../../ports/PhotoStorage';

interface Props extends ListingEdition {
  ownerId: string;
  listingId: string;
  editedAt: Date;
}

type EditListingError =
  | ActiveListingNotFoundError
  | ListingNotOwnedError
  | AvailabilityPeriodExpiredError
  | IncompletePricingError
  | UnknownVehicleTypeError
  | UnknownPhotoError
  | UnknownError;

export class EditListing implements UseCase<
  Props,
  Promise<Either.Either<Listing, EditListingError>>
> {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly photoStorage: PhotoStorage,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<Listing, EditListingError>> {
    try {
      const activeListing = await this.listingRepository.findActiveById(
        props.listingId,
      );
      if (!activeListing) return Either.left(new ActiveListingNotFoundError());

      const edition = activeListing.edit({
        ownerId: props.ownerId,
        accessDescription: props.accessDescription,
        photos: props.photos,
        acceptedVehicles: props.acceptedVehicles,
        pricing: props.pricing,
        availability: props.availability,
        editedAt: props.editedAt,
      });
      if (Either.isLeft(edition)) return Either.left(edition.left);

      const storedPhotos = activeListing.toState().photos;
      const addedPhotos = props.photos.filter(
        (photo) => !storedPhotos.includes(photo),
      );
      const ownedPhotoIds = await this.photoStorage.findIdsOwnedBy(
        props.ownerId,
        addedPhotos,
      );
      if (addedPhotos.some((photoId) => !ownedPhotoIds.includes(photoId)))
        return Either.left(new UnknownPhotoError());

      await this.listingRepository.save(edition.right);
      return Either.right(edition.right);
    } catch (error: unknown) {
      if (error instanceof ActiveListingNotFoundError)
        return Either.left(error);
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
