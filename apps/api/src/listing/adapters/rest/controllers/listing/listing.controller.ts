import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { OptionalAuthGuard } from '../../../../../user-management/adapters/rest/guards/optional-auth.guard';
import { AvailabilityPeriodExpiredError } from '../../../../domain/errors/AvailabilityPeriodExpiredError';
import { ListActiveListings } from '../../../../domain/usecases/list-active-listings/ListActiveListings';
import { ListFreeListings } from '../../../../domain/usecases/list-free-listings/ListFreeListings';
import { InvalidStayError } from '../../../../domain/usecases/list-free-listings/errors/InvalidStayError';
import { ListOwnerListings } from '../../../../domain/usecases/list-owner-listings/ListOwnerListings';
import { GetListing } from '../../../../domain/usecases/get-listing/GetListing';
import { IncompletePricingError } from '../../../../domain/errors/IncompletePricingError';
import { UnknownVehicleTypeError } from '../../../../domain/errors/UnknownVehicleTypeError';
import { ListingAlreadyActiveError } from '../../../../domain/usecases/publish-listing/errors/ListingAlreadyActiveError';
import { ListingNotFoundError } from '../../../../domain/usecases/get-listing/errors/ListingNotFoundError';
import { UnknownPhotoError } from '../../../../domain/errors/UnknownPhotoError';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { VehicleType } from '../../../../domain/entities/Listing';
import { ActiveListingNotFoundError } from '../../../../domain/errors/ActiveListingNotFoundError';
import { ListingNotOwnedError } from '../../../../domain/errors/ListingNotOwnedError';
import { UnpublishListing } from '../../../../domain/usecases/unpublish-listing/UnpublishListing';
import { EditListing } from '../../../../domain/usecases/edit-listing/EditListing';
import { ListingMapper } from '../../../mappers/ListingMapper';
import { GetListingResponseDto } from '../../dtos/GetListingResponseDto';
import { GetOwnerListingResponseDto } from '../../dtos/GetOwnerListingResponseDto';
import { EditListingSchema } from '../../dtos/EditListingSchema';
import { PublishListingSchema } from '../../dtos/PublishListingSchema';

@Controller('listing')
export class ListingController {
  constructor(
    private readonly publishListingUseCase: PublishListing,
    private readonly getListingUseCase: GetListing,
    private readonly listActiveListingsUseCase: ListActiveListings,
    private readonly listOwnerListingsUseCase: ListOwnerListings,
    private readonly unpublishListingUseCase: UnpublishListing,
    private readonly editListingUseCase: EditListing,
    private readonly listFreeListingsUseCase: ListFreeListings,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async publishListing(
    @Req() req: TokenRequest,
    @Body() body: unknown,
  ): Promise<void> {
    try {
      const decode = Schema.decodeUnknownEither(PublishListingSchema)(body);

      if (Either.isLeft(decode))
        throw new HttpException(
          parseSchemaError(decode.left),
          HttpStatus.BAD_REQUEST,
        );

      const parsedBody = decode.right;

      const result = await this.publishListingUseCase.execute({
        ownerId: req.user.id,
        address: parsedBody.address,
        box: parsedBody.box,
        accessDescription: parsedBody.accessDescription,
        photos: [...parsedBody.photos],
        acceptedVehicles: [
          ...(parsedBody.acceptedVehicles ?? []),
        ] as VehicleType[],
        pricing: {
          dayInCents: parsedBody.pricing.dayInCents ?? null,
          weekInCents: parsedBody.pricing.weekInCents ?? null,
          monthInCents: parsedBody.pricing.monthInCents ?? null,
        },
        availability: { ...parsedBody.availability },
        publishedAt: new Date(),
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof AvailabilityPeriodExpiredError) {
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        if (error instanceof IncompletePricingError) {
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        if (error instanceof UnknownVehicleTypeError) {
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        if (error instanceof ListingAlreadyActiveError) {
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        }
        if (error instanceof UnknownPhotoError) {
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        if (error instanceof UnknownError) {
          throw new HttpException(
            "La publication de l'annonce a échoué",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        throw new HttpException(
          "La publication de l'annonce a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'ListingController',
        method: 'publishListing',
        userId: req.user.id,
      });
    }
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  public async listListings(
    @Req() req: { user?: { id: string } },
    @Query('fromDay') fromDay: unknown,
    @Query('toDay') toDay: unknown,
  ): Promise<GetListingResponseDto[]> {
    if (fromDay === undefined && toDay === undefined) {
      const result = await this.listActiveListingsUseCase.execute();
      if (Either.isLeft(result))
        throw new HttpException(
          'La liste des annonces est indisponible',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      return result.right.map((listing) =>
        ListingMapper.toGetListingDto(listing),
      );
    }

    if (typeof fromDay !== 'string' || typeof toDay !== 'string')
      throw new HttpException(
        'Une recherche par dates demande une arrivée et un départ',
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.listFreeListingsUseCase.execute({
      stay: { from: fromDay, to: toDay },
      viewerId: req.user?.id ?? null,
    });
    if (Either.isLeft(result)) {
      if (result.left instanceof InvalidStayError)
        throw new HttpException(result.left.message, HttpStatus.BAD_REQUEST);
      throw new HttpException(
        'La liste des annonces est indisponible',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.right.map((listing) =>
      ListingMapper.toGetListingDto(listing),
    );
  }

  // Déclarée avant `@Get(':id')` : Nest confronte les routes dans l'ordre de
  // déclaration, et placée après, celle-ci ne serait jamais atteinte — « mine »
  // se ferait décoder comme un identifiant, puis refuser en 404.
  @Get('mine')
  @UseGuards(AuthGuard)
  public async listOwnerListings(
    @Req() req: TokenRequest,
  ): Promise<GetOwnerListingResponseDto[]> {
    const result = await this.listOwnerListingsUseCase.execute({
      ownerId: req.user.id,
    });

    if (Either.isLeft(result))
      throw new HttpException(
        'La liste de vos annonces est indisponible',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return result.right.map((listing) =>
      ListingMapper.toGetOwnerListingDto(listing),
    );
  }

  @Get(':id')
  async getListing(
    @Param('id') id: string,
  ): Promise<GetListingResponseDto | void> {
    try {
      const decode = Schema.decodeUnknownEither(Schema.UUID)(id);

      if (Either.isLeft(decode))
        throw new HttpException(
          new ListingNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );

      const result = await this.getListingUseCase.execute({
        listingId: decode.right,
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof ListingNotFoundError) {
          throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          "La lecture de l'annonce a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return ListingMapper.toGetListingDto(result.right);
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'ListingController',
        method: 'getListing',
        listingId: id,
      });
    }
  }
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unpublishListing(
    @Req() req: TokenRequest,
    @Param('id') id: string,
  ): Promise<void> {
    try {
      // Dépublier est idempotent : un identifiant mal formé, inconnu, ou déjà
      // dépublié répondent tous `204`, comme une seconde dépublication réussit
      // silencieusement dans le domaine (RG-07/EX-33). Cela évite aussi de faire
      // de cette route un oracle d'existence.
      const decode = Schema.decodeUnknownEither(Schema.UUID)(id);
      if (Either.isLeft(decode)) return;

      const found = await this.getListingUseCase.execute({
        listingId: decode.right,
      });
      if (Either.isLeft(found)) {
        if (found.left instanceof ListingNotFoundError) return;
        throw new HttpException(
          "La dépublication de l'annonce a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const place = found.right.toState();
      const result = await this.unpublishListingUseCase.execute({
        ownerId: req.user.id,
        address: place.address,
        box: place.box,
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        // Une annonce est lisible par tout le monde (RG-05) : cacher un refus de
        // propriété derrière un 404 ne protégerait rien que `GET /listing/:id`
        // ne donne déjà.
        if (error instanceof ListingNotOwnedError)
          throw new HttpException(error.message, HttpStatus.FORBIDDEN);
        throw new HttpException(
          "La dépublication de l'annonce a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'ListingController',
        method: 'unpublishListing',
        userId: req.user.id,
        listingId: id,
      });
    }
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async editListing(
    @Req() req: TokenRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<GetOwnerListingResponseDto | void> {
    try {
      const decodeId = Schema.decodeUnknownEither(Schema.UUID)(id);
      if (Either.isLeft(decodeId))
        throw new HttpException(
          new ActiveListingNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );

      const decodeBody = Schema.decodeUnknownEither(EditListingSchema)(body);
      if (Either.isLeft(decodeBody))
        throw new HttpException(
          parseSchemaError(decodeBody.left),
          HttpStatus.BAD_REQUEST,
        );

      const edition = decodeBody.right;
      const result = await this.editListingUseCase.execute({
        ownerId: req.user.id,
        listingId: decodeId.right,
        accessDescription: edition.accessDescription,
        photos: [...edition.photos],
        acceptedVehicles: [...edition.acceptedVehicles] as VehicleType[],
        pricing: {
          dayInCents: edition.pricing.dayInCents ?? null,
          weekInCents: edition.pricing.weekInCents ?? null,
          monthInCents: edition.pricing.monthInCents ?? null,
        },
        availability: { ...edition.availability },
        editedAt: new Date(),
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof ActiveListingNotFoundError)
          throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        if (error instanceof ListingNotOwnedError)
          throw new HttpException(error.message, HttpStatus.FORBIDDEN);
        if (
          error instanceof AvailabilityPeriodExpiredError ||
          error instanceof IncompletePricingError ||
          error instanceof UnknownVehicleTypeError ||
          error instanceof UnknownPhotoError
        )
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        throw new HttpException(
          "La modification de l'annonce a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return ListingMapper.toGetOwnerListingDto(result.right);
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'ListingController',
        method: 'editListing',
        userId: req.user.id,
        listingId: id,
      });
    }
  }
}
