import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
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
import { GetListing } from '../../../../domain/usecases/get-listing/GetListing';
import { IncompletePricingError } from '../../../../domain/errors/IncompletePricingError';
import { ListingAlreadyActiveError } from '../../../../domain/usecases/publish-listing/errors/ListingAlreadyActiveError';
import { ListingNotFoundError } from '../../../../domain/usecases/get-listing/errors/ListingNotFoundError';
import { PhotoStorageFailedError } from '../../../../domain/usecases/publish-listing/errors/PhotoStorageFailedError';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { ListingMapper } from '../../../mappers/ListingMapper';
import { GetListingResponseDto } from '../../dtos/GetListingResponseDto';
import { PublishListingSchema } from '../../dtos/PublishListingSchema';

@Controller('listing')
export class ListingController {
  constructor(
    private readonly publishListingUseCase: PublishListing,
    private readonly getListingUseCase: GetListing,
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
}
