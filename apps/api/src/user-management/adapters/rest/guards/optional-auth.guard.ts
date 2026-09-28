import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IncomingMessage } from 'http';

import { AccessTokenVerifier } from '../../../domain/ports/AccessTokenVerifier';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
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
      return true;

    const token = header.slice(BEARER_PREFIX.length).trim();
    if (token === '') return true;

    const payload = await this.accessTokenVerifier.verify(token);
    if (payload !== null && typeof payload.id === 'string' && payload.id !== '')
      request.user = { id: payload.id };
    return true;
  }
}
