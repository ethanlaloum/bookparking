import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { Notification } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { NotificationOutbox } from '../../../../shared/notification-outbox/domain/ports/NotificationOutbox';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { PaymentGateway } from '../../ports/PaymentGateway';
import { settleMoneyOwed } from '../../services/settleMoneyOwed';
import { RentalRepository } from '../../ports/RentalRepository';

export type PaymentEvent =
  | {
      kind: 'HOLD_PLACED';
      requestId: string;
      paymentId: string;
      placedAt: Date;
    }
  | { kind: 'PAYMENT_PAGE_EXPIRED'; requestId: string };

type Props = PaymentEvent & { receivedAt: Date };

export class RecordPaymentEvent implements UseCase<
  Props,
  Promise<Either.Either<void, UnknownError>>
> {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly notificationOutbox: NotificationOutbox,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  // Un événement qui ne désigne aucune demande, ou qui arrive une seconde fois,
  // réussit sans rien écrire : Stripe renvoie tout événement non accusé
  // pendant trois jours, et un refus ici le ferait revenir en boucle.
  public async execute(
    props: Props,
  ): Promise<Either.Either<void, UnknownError>> {
    try {
      const summary = await this.rentalRepository.findRequestSummary(
        props.requestId,
      );
      if (summary === null) return Either.right(undefined);

      if (props.kind === 'PAYMENT_PAGE_EXPIRED') {
        await this.rentalRepository.markAbandoned(props.requestId);
        return Either.right(undefined);
      }

      // C'est l'empreinte qui fait arriver la demande chez le loueur : il en
      // est prévenu dans la même transaction, et une seule fois — un
      // événement rejoué ne pose plus rien, et ne prévient donc personne.
      if (summary.status === 'AWAITING_PAYMENT') {
        await this.unitOfWork.process(async (trx) => {
          const placed = await this.rentalRepository.markHoldPlaced(
            props.requestId,
            props.paymentId,
            props.placedAt,
            trx,
          );
          if (placed)
            await this.notificationOutbox.notify(
              Notification.about({
                kind: 'RENTAL_REQUEST_RECEIVED',
                recipientId: summary.ownerId,
                rentalRequestId: props.requestId,
                createdAt: props.receivedAt,
              }),
              trx,
            );
        });
        return Either.right(undefined);
      }

      // Une empreinte posée sur une demande abandonnée — page payée juste
      // après l'abandon, ou événement arrivé après le balayage — n'a plus de
      // demande à garantir : elle est levée, sans jamais rouvrir les dates.
      if (
        await this.rentalRepository.oweReleaseOfLateHold(
          props.requestId,
          props.paymentId,
        )
      )
        await settleMoneyOwed(
          {
            requestId: props.requestId,
            paymentId: props.paymentId,
            owed: 'RELEASE_DUE',
            status: 'ABANDONED',
          },
          this.rentalRepository,
          this.paymentGateway,
          props.receivedAt,
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
