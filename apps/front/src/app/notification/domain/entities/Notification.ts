import type { components } from '../../../../api/schema';

export type Notification = components['schemas']['Notification'];
export type NotificationKind = components['schemas']['NotificationKind'];
export type NotificationList = components['schemas']['NotificationList'];

// L'onglet du compte où une notification mène : les demandes reçues pour le
// loueur, ses réservations pour le conducteur. Le site en fait une adresse,
// l'app un écran — c'est pourquoi ce n'est ni l'un ni l'autre.
export type NotificationDestination = 'received' | 'mine' | 'payouts';

// Un virement mène aux versements ; tout autre moment, à la demande qu'il
// concerne, du côté où se tient le destinataire.
export const destinationOf = (notification: Notification): NotificationDestination => {
  if (notification.kind === 'RENTAL_PAYOUT_SENT') return 'payouts';
  return notification.audience === 'OWNER' ? 'received' : 'mine';
};

export const isUnread = (notification: Notification): boolean => notification.readAt === null;

// Une confirmation se fête une fois, et une à la fois : la plus ancienne
// d'abord. Déjà lue, ou déjà montrée par la cloche, elle ne se fête plus.
export const bookingToCelebrate = (
  notifications: Notification[],
  acknowledged: string[],
): Notification | null =>
  notifications
    .filter(
      (notification) =>
        notification.kind === 'RENTAL_REQUEST_ACCEPTED' &&
        isUnread(notification) &&
        !acknowledged.includes(notification.id),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null;

// Le moment qui compte pour le destinataire : une bonne nouvelle, une
// mauvaise, ou une simple information. L'écran en tire sa couleur.
export type NotificationTone = 'positive' | 'negative' | 'neutral';

const TONES: Record<NotificationKind, NotificationTone> = {
  RENTAL_REQUEST_RECEIVED: 'positive',
  RENTAL_REQUEST_ACCEPTED: 'positive',
  RENTAL_REQUEST_DECLINED: 'negative',
  RENTAL_REQUEST_EXPIRED: 'negative',
  RENTAL_REQUEST_UNANSWERED: 'neutral',
  RENTAL_CANCELLED_BY_RENTER: 'negative',
  RENTAL_CANCELLED_BY_OWNER: 'negative',
  RENTAL_CANCELLED_BY_OPERATOR: 'negative',
  RENTAL_PAYMENT_FAILED: 'negative',
  RENTAL_PAYOUT_SENT: 'positive',
  RENTAL_ISSUE_REPORTED: 'negative',
  RENTAL_ISSUE_ANSWERED: 'neutral',
  RENTAL_ISSUE_RESOLVED: 'neutral',
};

export const toneOf = (notification: Notification): NotificationTone => TONES[notification.kind];
