import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IncomingMessage } from 'http';

import { AccessTokenVerifier } from '../../../domain/ports/AccessTokenVerifier';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AccessTokenVerifier')
    private readonly accessTokenVerifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<IncomingMessage & { user?: unknown }>();
    const header = request.headers.authorization;

    if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX))
      throw new UnauthorizedException();

    const token = header.slice(BEARER_PREFIX.length).trim();
    if (token === '') throw new UnauthorizedException();

    const payload = await this.accessTokenVerifier.verify(token);
    if (payload === null || typeof payload.id !== 'string' || payload.id === '')
      throw new UnauthorizedException();

    request.user = { id: payload.id };
    return true;
  }
}
