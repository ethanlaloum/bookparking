import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { NotificationInbox } from '../../ports/NotificationInbox';

interface Props {
  recipientId: string;
  readAt: Date;
}

// Ouvrir la cloche lit tout ce qu'elle montre. Idempotent par l'état : une
// seconde lecture ne trouve plus rien de non lu.
export class MarkNotificationsRead implements UseCase<
  Props,
  Promise<Either.Either<void, UnknownError>>
> {
  constructor(private readonly notificationInbox: NotificationInbox) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, UnknownError>> {
    try {
      await this.notificationInbox.markAllReadFor(
        props.recipientId,
        props.readAt,
      );
      return Either.right(undefined);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
