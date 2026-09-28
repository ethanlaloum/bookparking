import {
  AccessTokenPayload,
  AccessTokenVerifier,
} from '../../../domain/ports/AccessTokenVerifier';
import { AccountRepository } from '../../../domain/ports/AccountRepository';
import { slidingAccessToken } from '../../../domain/services/slidingAccessToken';

// Un jeton sans état survit à la suppression de son compte : c'est la lecture
// du compte, à chaque requête, qui le fait tomber — sans elle, l'iPhone resté
// connecté publierait encore au nom d'un compte effacé.
export class SlidingAccessTokenVerifier implements AccessTokenVerifier {
  constructor(
    private readonly accessTokenSecret: string,
    private readonly accountRepository: AccountRepository,
  ) {}

  public async verify(token: string): Promise<AccessTokenPayload | null> {
    const accepted = slidingAccessToken(
      token,
      new Date(),
      this.accessTokenSecret,
    );
    if (accepted === null) return null;
    if ((await this.accountRepository.findById(accepted.accountId)) === null)
      return null;
    return { id: accepted.accountId };
  }
}
