import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { AuthGuard } from '../../guards/auth.guard';
import { ChangePassword } from '../../../../domain/usecases/change-password/ChangePassword';
import { InvalidCredentialsError } from '../../../../domain/usecases/sign-in/errors/InvalidCredentialsError';
import { WeakPasswordError } from '../../../../domain/errors/WeakPasswordError';
import { ChooseAvatarSchema } from '../../dtos/AvatarSchema';
import { ChangePasswordSchema } from '../../dtos/ChangePasswordSchema';
import { TokenRequest } from '../../dtos/TokenRequest';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { HumanChallenge } from '../../../../domain/ports/HumanProof';
import { IssueHumanChallenge } from '../../../../domain/usecases/issue-human-challenge/IssueHumanChallenge';
import { ChooseAvatar } from '../../../../domain/usecases/choose-avatar/ChooseAvatar';
import { ReadOwnAccount } from '../../../../domain/usecases/read-own-account/ReadOwnAccount';
import { AccountNotFoundError } from '../../../../domain/errors/AccountNotFoundError';
import { RegisterAccount } from '../../../../domain/usecases/register-account/RegisterAccount';
import { EmailAlreadyUsedError } from '../../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';
import { HumanProofRejectedError } from '../../../../domain/usecases/register-account/errors/HumanProofRejectedError';
import { TermsNotAcceptedError } from '../../../../domain/usecases/register-account/errors/TermsNotAcceptedError';
import { AccountMapper } from '../../../mappers/AccountMapper';
import { OwnAccountResponseDto } from '../../dtos/OwnAccountResponseDto';
import { RegisterAccountResponseDto } from '../../dtos/RegisterAccountResponseDto';
import { RegisterAccountSchema } from '../../dtos/RegisterAccountSchema';

@Controller('account')
export class AccountController {
  constructor(
    private readonly registerAccountUseCase: RegisterAccount,
    private readonly changePasswordUseCase: ChangePassword,
    private readonly issueHumanChallengeUseCase: IssueHumanChallenge,
    private readonly readOwnAccountUseCase: ReadOwnAccount,
    private readonly chooseAvatarUseCase: ChooseAvatar,
  ) {}

  // Changer de pilote, depuis « Réglages ». Le compte est celui du jeton.
  @Patch('avatar')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async chooseAvatar(
    @Req() req: TokenRequest,
    @Body() body: unknown,
  ): Promise<void> {
    try {
      const decode = Schema.decodeUnknownEither(ChooseAvatarSchema)(body);

      if (Either.isLeft(decode))
        throw new HttpException(
          parseSchemaError(decode.left),
          HttpStatus.BAD_REQUEST,
        );

      const result = await this.chooseAvatarUseCase.execute({
        accountId: req.user.id,
        avatar: decode.right.avatar,
      });

      if (Either.isLeft(result)) {
        if (result.left instanceof AccountNotFoundError)
          throw new HttpException(result.left.message, HttpStatus.NOT_FOUND);
        throw new HttpException(
          "Le changement d'avatar a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'AccountController',
        method: 'chooseAvatar',
        userId: req.user.id,
      });
    }
  }

  // Le compte du jeton, et lui seul : la route ne prend aucun identifiant.
  // `POST /session` ne rend qu'un jeton ; c'est d'ici que le site et l'app
  // tirent l'adresse et l'avatar du compte connecté.
  @Get()
  @UseGuards(AuthGuard)
  public async readOwnAccount(
    @Req() req: TokenRequest,
  ): Promise<OwnAccountResponseDto | void> {
    try {
      const result = await this.readOwnAccountUseCase.execute({
        accountId: req.user.id,
      });

      if (Either.isLeft(result)) {
        if (result.left instanceof AccountNotFoundError)
          throw new HttpException(result.left.message, HttpStatus.NOT_FOUND);
        throw new HttpException(
          'La lecture du compte a échoué',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return AccountMapper.toOwnAccountDto(result.right);
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'AccountController',
        method: 'readOwnAccount',
        userId: req.user.id,
      });
    }
  }

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
        avatar: parsedBody.avatar,
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
