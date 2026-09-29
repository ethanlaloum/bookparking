import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { SignIn } from '../../../../domain/usecases/sign-in/SignIn';
import { SignInSchema } from '../../dtos/SignInSchema';

// Une origine que la connexion ne nomme pas retombe sur une clé commune :
// toutes ces tentatives se ralentissent alors les unes les autres, plutôt que
// d'échapper au compteur.
const UNNAMED_ORIGIN = 'origine-inconnue';

@Controller('session')
export class SessionController {
  constructor(private readonly signInUseCase: SignIn) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  public async signIn(
    @Body() body: unknown,
    @Ip() origin: string,
  ): Promise<{ token: string; validUntil: string }> {
    const decode = Schema.decodeUnknownEither(SignInSchema)(body);

    if (Either.isLeft(decode))
      throw new HttpException(
        parseSchemaError(decode.left),
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.signInUseCase.execute({
      email: decode.right.email,
      password: decode.right.password,
      originKey: origin || UNNAMED_ORIGIN,
      at: new Date(),
    });

    if (Either.isLeft(result))
      throw new HttpException(
        'Adresse e-mail ou mot de passe incorrect',
        HttpStatus.UNAUTHORIZED,
      );

    return {
      token: result.right.token,
      validUntil: result.right.validUntil.toISOString(),
    };
  }
}
