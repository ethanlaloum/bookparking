import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { BackOfficeRepository } from '../../../domain/ports/BackOfficeRepository';

interface RequestWithUser {
  user?: { id?: unknown };
}

/**
 * Se place *après* `AuthGuard`, qui a déjà posé `request.user`. Il ne lit aucun
 * en-tête : le seul fait qui l'intéresse est l'appartenance à
 * `back_office_admins`, et elle se lit en base à chaque requête. Un jeton émis
 * avant une révocation ne donne donc aucun sursis.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject('BackOfficeRepository')
    private readonly backOfficeRepository: BackOfficeRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const accountId = request.user?.id;
    if (typeof accountId !== 'string' || accountId === '')
      throw new ForbiddenException(
        "Cette action est réservée à l'administration du site",
      );

    if (!(await this.backOfficeRepository.isAdmin(accountId)))
      throw new ForbiddenException(
        "Cette action est réservée à l'administration du site",
      );

    return true;
  }
}
