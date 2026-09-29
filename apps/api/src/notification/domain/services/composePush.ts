import { NotificationKind } from '../../../shared/notification-outbox/domain/entities/Notification';

export interface ComposedPush {
  title: string;
  body: string;
}

// Un push s'affiche sur l'écran verrouillé et passe par Expo puis Apple : il
// ne dit ni l'adresse de la place ni les dates, comme l'e-mail. L'app les
// montre à qui l'ouvre.
const PUSHES: Record<NotificationKind, ComposedPush> = {
  RENTAL_REQUEST_RECEIVED: {
    title: 'Nouvelle demande de réservation',
    body: 'Un conducteur souhaite louer votre place. Répondez-lui avant que sa demande expire.',
  },
  RENTAL_REQUEST_ACCEPTED: {
    title: 'Votre réservation est confirmée',
    body: 'Le loueur a accepté votre demande : la place vous est réservée.',
  },
  RENTAL_REQUEST_DECLINED: {
    title: "Votre demande n'a pas été acceptée",
    body: 'Le loueur a décliné votre demande. Rien ne vous a été prélevé.',
  },
  RENTAL_REQUEST_EXPIRED: {
    title: 'Votre demande a expiré',
    body: "Le loueur n'a pas répondu à temps. Rien ne vous a été prélevé.",
  },
  RENTAL_REQUEST_UNANSWERED: {
    title: 'Une demande a expiré sans réponse',
    body: "Vous n'avez pas répondu à temps à une demande sur votre place.",
  },
  RENTAL_CANCELLED_BY_RENTER: {
    title: 'Une réservation a été annulée',
    body: 'Le conducteur a annulé sa réservation : les dates sont de nouveau libres.',
  },
  RENTAL_CANCELLED_BY_OWNER: {
    title: 'Votre réservation a été annulée',
    body: 'Le loueur a annulé votre réservation. Ce qui vous a été prélevé vous est rendu.',
  },
  RENTAL_CANCELLED_BY_OPERATOR: {
    title: 'Une réservation a été annulée par Bookparking',
    body: 'Bookparking a annulé une réservation qui vous concerne.',
  },
  RENTAL_PAYOUT_SENT: {
    title: 'Votre versement est parti',
    body: "L'argent d'une location, commission déduite, part vers votre compte bancaire.",
  },
  RENTAL_ISSUE_REPORTED: {
    title: 'Un problème est signalé sur votre place',
    body: "Le conducteur dit qu'il ne peut pas l'utiliser. Répondez-lui : l'argent reste gelé en attendant.",
  },
  RENTAL_ISSUE_ANSWERED: {
    title: 'Le loueur vous a répondu',
    body: 'Il a répondu au problème que vous avez signalé. Bookparking examine la réclamation.',
  },
  RENTAL_ISSUE_RESOLVED: {
    title: 'Votre réclamation est tranchée',
    body: 'Bookparking a pris sa décision sur le problème signalé.',
  },
  RENTAL_PAYMENT_FAILED: {
    title: "Votre paiement n'a pas abouti",
    body: "Votre banque a refusé le paiement : la réservation n'a pas pu être confirmée.",
  },
};

export const composePush = (kind: NotificationKind): ComposedPush =>
  PUSHES[kind];
