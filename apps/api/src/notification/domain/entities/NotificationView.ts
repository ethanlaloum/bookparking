import { NotificationKind } from '../../../shared/notification-outbox/domain/entities/Notification';

export type NotificationAudience = 'OWNER' | 'RENTER';

// Ce que la cloche montre d'une notification : son moment, la place et les
// dates de la demande qu'elle concerne, et le rôle du destinataire sur cette
// demande — qui décide où le site l'emmène. L'adresse et le box sont lus sur
// `listings` au moment de l'affichage, jamais recopiés dans la notification.
export interface NotificationView {
  id: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  createdAt: Date;
  readAt: Date | null;
  requestId: string;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
}

const OWNER_KINDS: NotificationKind[] = [
  'RENTAL_REQUEST_RECEIVED',
  'RENTAL_REQUEST_UNANSWERED',
  'RENTAL_CANCELLED_BY_RENTER',
  'RENTAL_PAYOUT_SENT',
  'RENTAL_ISSUE_REPORTED',
];

// Ceux qui visent les deux parties : le destinataire dit de quel côté il se
// tient.
const BOTH_PARTIES_KINDS: NotificationKind[] = [
  'RENTAL_CANCELLED_BY_OPERATOR',
  'RENTAL_ISSUE_RESOLVED',
];

// Chaque type vise une partie, sauf l'annulation par Bookparking, qui vise les
// deux : c'est alors le destinataire qui dit de quel côté il se tient. Le
// conducteur passe d'abord, comme dans `CancelRental.partyOf`.
export const audienceOf = (
  kind: NotificationKind,
  recipientIsTheRenter: boolean,
): NotificationAudience => {
  if (BOTH_PARTIES_KINDS.includes(kind))
    return recipientIsTheRenter ? 'RENTER' : 'OWNER';
  return OWNER_KINDS.includes(kind) ? 'OWNER' : 'RENTER';
};
