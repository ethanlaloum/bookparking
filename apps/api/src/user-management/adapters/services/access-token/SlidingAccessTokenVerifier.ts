import {
  AccessTokenPayload,
  AccessTokenVerifier,
} from '../../../domain/ports/AccessTokenVerifier';
import { slidingAccessToken } from '../../../domain/services/slidingAccessToken';

export class SlidingAccessTokenVerifier implements AccessTokenVerifier {
  constructor(private readonly accessTokenSecret: string) {}

  public async verify(token: string): Promise<AccessTokenPayload | null> {
    const accepted = slidingAccessToken(
      token,
      new Date(),
      this.accessTokenSecret,
    );
    if (accepted === null) return null;
    return { id: accepted.accountId };
  }
}
