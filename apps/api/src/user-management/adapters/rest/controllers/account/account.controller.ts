import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { AuthGuard } from '../../guards/auth.guard';
import { ChangePassword } from '../../../../domain/usecases/change-password/ChangePassword';
import { InvalidCredentialsError } from '../../../../domain/usecases/sign-in/errors/InvalidCredentialsError';
import { WeakPasswordError } from '../../../../domain/usecases/change-password/errors/WeakPasswordError';
import { ChangePasswordSchema } from '../../dtos/ChangePasswordSchema';
import { TokenRequest } from '../../dtos/TokenRequest';

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
  constructor(
    private readonly registerAccountUseCase: RegisterAccount,
    private readonly changePasswordUseCase: ChangePassword,
  ) {}

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

  @Post('password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async changePassword(
    @Req() req: TokenRequest,
    @Body() body: unknown,
  ): Promise<void> {
    try {
      const decode = Schema.decodeUnknownEither(ChangePasswordSchema)(body);

      if (Either.isLeft(decode))
        throw new HttpException(
          parseSchemaError(decode.left),
          HttpStatus.BAD_REQUEST,
        );

      const result = await this.changePasswordUseCase.execute({
        accountId: req.user.id,
        currentPassword: decode.right.currentPassword,
        newPassword: decode.right.newPassword,
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof InvalidCredentialsError)
          throw new HttpException(error.message, HttpStatus.FORBIDDEN);
        if (error instanceof WeakPasswordError)
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        throw new HttpException(
          'Le changement de mot de passe a échoué',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'AccountController',
        method: 'changePassword',
        userId: req.user.id,
      });
    }
  }
}
