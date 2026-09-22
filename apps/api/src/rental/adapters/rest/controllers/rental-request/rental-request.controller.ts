import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { RequestRental } from '../../../../domain/usecases/request-rental/RequestRental';
import { RequestRentalSchema } from '../../dtos/RequestRentalSchema';

@Controller('rental-request')
export class RentalRequestController {
  constructor(private readonly requestRentalUseCase: RequestRental) {}

  @Post()
  @UseGuards(AuthGuard)
  public async requestRental(
    @Req() req: TokenRequest,
    @Body() body: unknown,
  ): Promise<void> {
    try {
      const decode = Schema.decodeUnknownEither(RequestRentalSchema)(body);

      if (Either.isLeft(decode))
        throw new HttpException(
          parseSchemaError(decode.left),
          HttpStatus.BAD_REQUEST,
        );

      const result = await this.requestRentalUseCase.execute({
        renterId: req.user.id,
        address: decode.right.address,
        box: decode.right.box,
        fromDay: decode.right.fromDay,
        toDay: decode.right.toDay,
        requestedAt: new Date(),
      });

      if (Either.isLeft(result))
        throw new HttpException(
          result.left.message,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'RentalRequestController',
        method: 'requestRental',
        userId: req.user.id,
      });
    }
  }
}
