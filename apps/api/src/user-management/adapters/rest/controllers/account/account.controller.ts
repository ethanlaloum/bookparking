import {
  Body,
  Controller,
  Get,
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
import { WeakPasswordError } from '../../../../domain/errors/WeakPasswordError';
import { ChangePasswordSchema } from '../../dtos/ChangePasswordSchema';
import { TokenRequest } from '../../dtos/TokenRequest';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { HumanChallenge } from '../../../../domain/ports/HumanProof';
import { IssueHumanChallenge } from '../../../../domain/usecases/issue-human-challenge/IssueHumanChallenge';
import { RegisterAccount } from '../../../../domain/usecases/register-account/RegisterAccount';
import { EmailAlreadyUsedError } from '../../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';
import { HumanProofRejectedError } from '../../../../domain/usecases/register-account/errors/HumanProofRejectedError';
import { TermsNotAcceptedError } from '../../../../domain/usecases/register-account/errors/TermsNotAcceptedError';
import { AccountMapper } from '../../../mappers/AccountMapper';
import { RegisterAccountResponseDto } from '../../dtos/RegisterAccountResponseDto';
import { RegisterAccountSchema } from '../../dtos/RegisterAccountSchema';

@Controller('account')
export class AccountController {
  constructor(
    private readonly registerAccountUseCase: RegisterAccount,
    private readonly changePasswordUseCase: ChangePassword,
    private readonly issueHumanChallengeUseCase: IssueHumanChallenge,
  ) {}

  // SPEC-007 RG-03 : le défi que le navigateur résout avant de s'inscrire.
  // Public, comme l'inscription elle-même.
  @Get('human-challenge')
  async issueHumanChallenge(): Promise<HumanChallenge | void> {
    try {
      const result = await this.issueHumanChallengeUseCase.execute({
        now: new Date(),
      });
      if (Either.isRight(result)) return result.right;
    } catch (error) {
      controllerErrorHandler(error, {
        name: 'AccountController',
        method: 'issueHumanChallenge',
      });
    }
  }

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
        humanProof: parsedBody.humanProof,
        acceptsTerms: parsedBody.acceptsTerms,
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof EmailAlreadyUsedError) {
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        }
        if (
          error instanceof WeakPasswordError ||
          error instanceof HumanProofRejectedError ||
          error instanceof TermsNotAcceptedError
        ) {
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
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
