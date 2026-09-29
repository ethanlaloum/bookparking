import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { WeakPasswordError } from '../../../../domain/errors/WeakPasswordError';
import { RequestPasswordReset } from '../../../../domain/usecases/request-password-reset/RequestPasswordReset';
import { InvalidPasswordResetTokenError } from '../../../../domain/usecases/reset-password/errors/InvalidPasswordResetTokenError';
import { ResetPassword } from '../../../../domain/usecases/reset-password/ResetPassword';
import {
  RequestPasswordResetSchema,
  ResetPasswordSchema,
} from '../../dtos/PasswordResetSchema';

@Controller('account/password-reset')
export class PasswordResetController {
  constructor(
    private readonly requestPasswordResetUseCase: RequestPasswordReset,
    private readonly resetPasswordUseCase: ResetPassword,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  public async requestReset(@Body() body: unknown): Promise<void> {
    try {
      const decode = Schema.decodeUnknownEither(RequestPasswordResetSchema)(
        body,
      );

      if (Either.isLeft(decode))
        throw new HttpException(
          parseSchemaError(decode.left),
          HttpStatus.BAD_REQUEST,
        );

      const result = await this.requestPasswordResetUseCase.execute({
        email: decode.right.email,
        requestedAt: new Date(),
      });

      if (Either.isLeft(result))
        throw new HttpException(
          'La demande de réinitialisation a échoué',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'PasswordResetController',
        method: 'requestReset',
      });
    }
  }

  @Post('confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async resetPassword(@Body() body: unknown): Promise<void> {
    try {
      const decode = Schema.decodeUnknownEither(ResetPasswordSchema)(body);

      if (Either.isLeft(decode))
        throw new HttpException(
          parseSchemaError(decode.left),
          HttpStatus.BAD_REQUEST,
        );

      const result = await this.resetPasswordUseCase.execute({
        token: decode.right.token,
        newPassword: decode.right.newPassword,
        resetAt: new Date(),
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (
          error instanceof InvalidPasswordResetTokenError ||
          error instanceof WeakPasswordError
        )
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        throw new HttpException(
          'La réinitialisation du mot de passe a échoué',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'PasswordResetController',
        method: 'resetPassword',
      });
    }
  }
}
