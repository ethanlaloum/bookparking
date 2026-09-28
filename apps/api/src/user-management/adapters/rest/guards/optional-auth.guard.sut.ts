import { ExecutionContext } from '@nestjs/common';

import {
  AccessTokenPayload,
  AccessTokenVerifier,
} from '../../../domain/ports/AccessTokenVerifier';
import { OptionalAuthGuard } from './optional-auth.guard';

class TokenBook implements AccessTokenVerifier {
  public readonly accounts = new Map<string, string>();
  public readonly verified: string[] = [];

  async verify(token: string): Promise<AccessTokenPayload | null> {
    this.verified.push(token);
    const id = this.accounts.get(token);
    return id === undefined ? null : { id };
  }
}

export const createOptionalAuthGuardSUT = () => {
  const tokens = new TokenBook();
  const guard = new OptionalAuthGuard(tokens);

  return {
    givenValidToken(token: string, accountId: string) {
      tokens.accounts.set(token, accountId);
    },

    async whenGuarding(authorization: string | undefined) {
      const request: { headers: { authorization?: string }; user?: unknown } = {
        headers: authorization === undefined ? {} : { authorization },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;
      const letThrough = await guard.canActivate(context);
      return { letThrough, user: request.user ?? null };
    },

    thenTokensVerifiedAre(expected: string[]) {
      expect(tokens.verified).toEqual(expected);
    },
  };
};
