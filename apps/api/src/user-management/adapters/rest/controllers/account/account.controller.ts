import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { RegisterAccount } from '../../../../domain/usecases/register-account/RegisterAccount';
import { EmailAlreadyUsedError } from '../../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';
import { AccountMapper } from '../../../mappers/AccountMapper';
import { RegisterAccountResponseDto } from '../../dtos/RegisterAccountResponseDto';
import { RegisterAccountSchema } from '../../dtos/RegisterAccountSchema';

@Controller('account')
export class AccountController {
  constructor(private readonly registerAccountUseCase: RegisterAccount) {}

  @Post()
  async registerAccount(
    @Body() body: unknown,
  ): Promise<RegisterAccountResponseDto | void> {
    try {
      const decode = Schema.decodeUnknownEither(RegisterAccountSchema)(body);

      if (Either.isLeft(decode))
        throw new HttpException(
          parseSchemaError(decode.left),
          HttpStatus.BAD_REQUEST,
        );

      const parsedBody = decode.right;

      const result = await this.registerAccountUseCase.execute({
        email: parsedBody.email,
        password: parsedBody.password,
        registeredAt: new Date(),
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof EmailAlreadyUsedError) {
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        }
        if (error instanceof UnknownError) {
          throw new HttpException(
            "L'inscription a échoué",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        throw new HttpException(
          "L'inscription a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return AccountMapper.toRegisterAccountDto(result.right);
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'AccountController',
        method: 'registerAccount',
      });
    }
  }
}
