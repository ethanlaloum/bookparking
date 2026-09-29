import type { SessionGateway } from '@front/app/auth/domain/ports/SessionGateway';
import type { SessionStore } from '@front/app/auth/domain/ports/SessionStore';

import type { BackOfficeGateway } from '../app/back-office/domain/ports/BackOfficeGateway';

export interface Dependencies {
  backOfficeGateway: BackOfficeGateway;
  sessionGateway: SessionGateway;
  sessionStore: SessionStore;
}
