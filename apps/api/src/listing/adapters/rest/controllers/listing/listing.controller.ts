import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { AvailabilityPeriodExpiredError } from '../../../../domain/usecases/publish-listing/errors/AvailabilityPeriodExpiredError';
import { PhotoStorageFailedError } from '../../../../domain/usecases/publish-listing/errors/PhotoStorageFailedError';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { PublishListingSchema } from '../../dtos/PublishListingSchema';

@Controller('listing')
export class ListingController {
  constructor(private readonly publishListingUseCase: PublishListing) {}

  @Post()
  async publishListing(@Body() body: unknown): Promise<void> {
    const decode = Schema.decodeUnknownEither(PublishListingSchema)(body);

    if (Either.isLeft(decode))
      throw new HttpException(
        parseSchemaError(decode.left),
        HttpStatus.BAD_REQUEST,
      );

    const parsedBody = decode.right;

    const result = await this.publishListingUseCase.execute({
      ownerName: parsedBody.ownerName,
      address: parsedBody.address,
      box: parsedBody.box,
      accessDescription: parsedBody.accessDescription,
      photos: [...parsedBody.photos],
      pricing: { ...parsedBody.pricing },
      availability: { ...parsedBody.availability },
      publishedAt: new Date(),
    });

    if (Either.isLeft(result)) {
      const error = result.left;
      if (error instanceof AvailabilityPeriodExpiredError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof PhotoStorageFailedError) {
        throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
      }
      throw new HttpException(
        "La publication de l'annonce a échoué",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
