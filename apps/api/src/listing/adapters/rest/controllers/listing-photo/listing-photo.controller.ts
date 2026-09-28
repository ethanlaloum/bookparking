import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { MAX_PHOTO_SIZE_IN_BYTES } from '../../../../domain/entities/ListingPhoto';
import { PhotoTooLargeError } from '../../../../domain/errors/PhotoTooLargeError';
import { UnsupportedPhotoFormatError } from '../../../../domain/errors/UnsupportedPhotoFormatError';
import { ListingPhotoNotFoundError } from '../../../../domain/usecases/get-listing-photo/errors/ListingPhotoNotFoundError';
import { GetListingPhoto } from '../../../../domain/usecases/get-listing-photo/GetListingPhoto';
import { UploadListingPhoto } from '../../../../domain/usecases/upload-listing-photo/UploadListingPhoto';
import { UploadListingPhotoResponseDto } from '../../dtos/UploadListingPhotoResponseDto';
import { PhotoTooLargeFilter } from '../../filters/PhotoTooLargeFilter';

interface UploadedPhoto {
  buffer: Buffer;
}

interface HeaderWriter {
  setHeader(name: string, value: string): void;
}

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

@Controller('listing/photo')
export class ListingPhotoController {
  constructor(
    private readonly uploadListingPhotoUseCase: UploadListingPhoto,
    private readonly getListingPhotoUseCase: GetListingPhoto,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseFilters(PhotoTooLargeFilter)
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: MAX_PHOTO_SIZE_IN_BYTES } }),
  )
  async uploadListingPhoto(
    @Req() req: TokenRequest,
    @UploadedFile() photo: UploadedPhoto | undefined,
  ): Promise<UploadListingPhotoResponseDto | void> {
    try {
      if (photo === undefined)
        throw new HttpException(
          'Aucune photo reçue dans le champ « photo »',
          HttpStatus.BAD_REQUEST,
        );

      const result = await this.uploadListingPhotoUseCase.execute({
        ownerId: req.user.id,
        bytes: photo.buffer,
        uploadedAt: new Date(),
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof UnsupportedPhotoFormatError)
          throw new HttpException(
            error.message,
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
          );
        if (error instanceof PhotoTooLargeError)
          throw new HttpException(error.message, HttpStatus.PAYLOAD_TOO_LARGE);
        throw new HttpException(
          "L'envoi de la photo a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return { id: result.right.id };
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'ListingPhotoController',
        method: 'uploadListingPhoto',
        userId: req.user.id,
      });
    }
  }

  @Get(':id')
  async getListingPhoto(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: HeaderWriter,
  ): Promise<StreamableFile | void> {
    try {
      const decode = Schema.decodeUnknownEither(Schema.UUID)(id);
      if (Either.isLeft(decode))
        throw new HttpException(
          new ListingPhotoNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );

      const result = await this.getListingPhotoUseCase.execute({
        photoId: decode.right,
      });

      if (Either.isLeft(result)) {
        if (result.left instanceof ListingPhotoNotFoundError)
          throw new HttpException(result.left.message, HttpStatus.NOT_FOUND);
        throw new HttpException(
          'La lecture de la photo a échoué',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const photo = result.right.toState();
      res.setHeader(
        'Cache-Control',
        `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`,
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      return new StreamableFile(Buffer.from(photo.bytes), {
        type: photo.format,
        length: photo.bytes.length,
      });
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'ListingPhotoController',
        method: 'getListingPhoto',
        photoId: id,
      });
    }
  }
}
