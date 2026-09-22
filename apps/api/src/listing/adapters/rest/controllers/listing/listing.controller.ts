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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { AvailabilityPeriodExpiredError } from '../../../../domain/usecases/publish-listing/errors/AvailabilityPeriodExpiredError';
import { ListActiveListings } from '../../../../domain/usecases/list-active-listings/ListActiveListings';
import { ListOwnerListings } from '../../../../domain/usecases/list-owner-listings/ListOwnerListings';
import { GetListing } from '../../../../domain/usecases/get-listing/GetListing';
import { IncompletePricingError } from '../../../../domain/errors/IncompletePricingError';
import { ListingAlreadyActiveError } from '../../../../domain/usecases/publish-listing/errors/ListingAlreadyActiveError';
import { ListingNotFoundError } from '../../../../domain/usecases/get-listing/errors/ListingNotFoundError';
import { PhotoStorageFailedError } from '../../../../domain/usecases/publish-listing/errors/PhotoStorageFailedError';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { ActiveListingNotFoundError } from '../../../../domain/usecases/update-listing-pricing/errors/ActiveListingNotFoundError';
import { ListingNotOwnedError } from '../../../../domain/errors/ListingNotOwnedError';
import { UnpublishListing } from '../../../../domain/usecases/unpublish-listing/UnpublishListing';
import { UpdateListingPricing } from '../../../../domain/usecases/update-listing-pricing/UpdateListingPricing';
import { ListingMapper } from '../../../mappers/ListingMapper';
import { GetListingResponseDto } from '../../dtos/GetListingResponseDto';
import { GetOwnerListingResponseDto } from '../../dtos/GetOwnerListingResponseDto';
import { PublishListingSchema } from '../../dtos/PublishListingSchema';
import { UpdateListingPricingSchema } from '../../dtos/UpdateListingPricingSchema';

@Controller('listing')
export class ListingController {
  constructor(
    private readonly publishListingUseCase: PublishListing,
    private readonly getListingUseCase: GetListing,
    private readonly listActiveListingsUseCase: ListActiveListings,
    private readonly listOwnerListingsUseCase: ListOwnerListings,
    private readonly unpublishListingUseCase: UnpublishListing,
    private readonly updateListingPricingUseCase: UpdateListingPricing,
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
        if (error instanceof ListingAlreadyActiveError) {
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        }
        if (error instanceof PhotoStorageFailedError) {
          throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
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
  public async listListings(): Promise<GetListingResponseDto[]> {
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
  // Les deux cas d'usage ci-dessous sont clés sur la place — adresse et box —
  // quand la route l'est sur l'identifiant que `GET /listing` rend aux clients.
  // `GetListing` fait la jonction : c'est une lecture de plus par requête,
  // assumée, pour ne pas réécrire deux cas d'usage déjà prouvés.
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

  @Patch(':id/pricing')
  @UseGuards(AuthGuard)
  async updateListingPricing(
    @Req() req: TokenRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<GetListingResponseDto | void> {
    try {
      const decodeId = Schema.decodeUnknownEither(Schema.UUID)(id);
      if (Either.isLeft(decodeId))
        throw new HttpException(
          new ActiveListingNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );

      const decodeBody = Schema.decodeUnknownEither(UpdateListingPricingSchema)(
        body,
      );
      if (Either.isLeft(decodeBody))
        throw new HttpException(
          parseSchemaError(decodeBody.left),
          HttpStatus.BAD_REQUEST,
        );

      const found = await this.getListingUseCase.execute({
        listingId: decodeId.right,
      });
      if (Either.isLeft(found)) {
        if (found.left instanceof ListingNotFoundError)
          throw new HttpException(
            new ActiveListingNotFoundError().message,
            HttpStatus.NOT_FOUND,
          );
        throw new HttpException(
          'La mise à jour de la grille tarifaire a échoué',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const place = found.right.toState();
      const result = await this.updateListingPricingUseCase.execute({
        ownerId: req.user.id,
        address: place.address,
        box: place.box,
        pricing: {
          dayInCents: decodeBody.right.dayInCents ?? null,
          weekInCents: decodeBody.right.weekInCents ?? null,
          monthInCents: decodeBody.right.monthInCents ?? null,
        },
        updatedAt: new Date(),
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof IncompletePricingError)
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        if (error instanceof ListingNotOwnedError)
          throw new HttpException(error.message, HttpStatus.FORBIDDEN);
        if (error instanceof ActiveListingNotFoundError)
          throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        throw new HttpException(
          'La mise à jour de la grille tarifaire a échoué',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return ListingMapper.toGetListingDto(result.right);
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'ListingController',
        method: 'updateListingPricing',
        userId: req.user.id,
        listingId: id,
      });
    }
  }
}
