import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface TestAuthState {
  user: { id: string } | null;
}

export class TestAuthGuard implements CanActivate {
  constructor(private readonly authState: TestAuthState) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header: unknown = request.headers?.authorization;

    if (
      typeof header !== 'string' ||
      !header.startsWith('Bearer ') ||
      this.authState.user === null
    )
      throw new UnauthorizedException();

    request['user'] = this.authState.user;
    return true;
  }
}
