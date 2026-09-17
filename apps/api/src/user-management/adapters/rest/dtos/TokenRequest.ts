import { IncomingMessage } from 'http';

import { AccessTokenPayload } from '../../../domain/ports/AccessTokenVerifier';

export interface TokenRequest extends IncomingMessage {
  user: AccessTokenPayload;
}
