import { Notification } from '../../../shared/notification-outbox/domain/entities/Notification';
import { NotificationOutbox } from '../../../shared/notification-outbox/domain/ports/NotificationOutbox';
import { UnitOfWork } from '../../../shared/unit-of-work/UnitOfWork';
import { RentalRepository } from '../ports/RentalRepository';

// Le balayage et la demande de location expirent les mêmes demandes : celles
// que le loueur a laissées sans réponse au-delà du délai. Ses deux parties en
// sont prévenues dans la transaction qui les expire — le conducteur que sa
// demande n'aboutira pas, le loueur qu'il a laissé passer une réservation.
// Rend le nombre de demandes expirées.
export const expireLapsedRequests = async (
  deadline: Date,
  now: Date,
  rentalRepository: RentalRepository,
  notificationOutbox: NotificationOutbox,
  unitOfWork: UnitOfWork,
): Promise<number> =>
  unitOfWork.process(async (trx) => {
    const lapsed = [
      ...(await rentalRepository.expireHoldsPlacedSince(deadline, trx)),
      ...(await rentalRepository.expireRequestsPendingSince(deadline, trx)),
    ];
    for (const request of lapsed) {
      await notificationOutbox.notify(
        Notification.about({
          kind: 'RENTAL_REQUEST_EXPIRED',
          recipientId: request.renterId,
          rentalRequestId: request.requestId,
          createdAt: now,
        }),
        trx,
      );
      await notificationOutbox.notify(
        Notification.about({
          kind: 'RENTAL_REQUEST_UNANSWERED',
          recipientId: request.ownerId,
          rentalRequestId: request.requestId,
          createdAt: now,
        }),
        trx,
      );
    }
    return lapsed.length;
  });
