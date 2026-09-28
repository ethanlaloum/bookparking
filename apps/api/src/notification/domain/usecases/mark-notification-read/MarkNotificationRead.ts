import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { NotificationInbox } from '../../ports/NotificationInbox';

interface Props {
  recipientId: string;
  notificationId: string;
  readAt: Date;
}

// Une notification lue ailleurs que dans la cloche : l'app et le site fêtent
// une réservation confirmée, puis la marquent lue pour ne la fêter qu'une fois.
export class MarkNotificationRead implements UseCase<
  Props,
  Promise<Either.Either<void, UnknownError>>
> {
  constructor(private readonly notificationInbox: NotificationInbox) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, UnknownError>> {
    try {
      await this.notificationInbox.markReadFor(
        props.recipientId,
        props.notificationId,
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
