import { CanActivate, ExecutionContext } from '@nestjs/common';

import { TestAuthState } from './TestAuthGuard';

export class TestOptionalAuthGuard implements CanActivate {
  constructor(private readonly authState: TestAuthState) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header: unknown = request.headers?.authorization;
    if (
      typeof header === 'string' &&
      header.startsWith('Bearer ') &&
      this.authState.user !== null
    )
      request['user'] = this.authState.user;
    return true;
  }
}
