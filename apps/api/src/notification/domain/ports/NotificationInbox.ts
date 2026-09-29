import { NotificationView } from '../entities/NotificationView';

// La cloche d'un compte : ses dernières notifications, combien il n'en a pas
// lues, et la lecture de toutes d'un coup. Chaque méthode est clée sur le
// destinataire : un compte ne lit ni ne marque jamais celles d'un autre.
export interface NotificationInbox {
  findLatestFor(
    recipientId: string,
    limit: number,
  ): Promise<NotificationView[]>;
  countUnreadFor(recipientId: string): Promise<number>;
  // Ne touche que les non lues : relue, une notification garde l'instant de
  // sa première lecture.
  markAllReadFor(recipientId: string, readAt: Date): Promise<void>;
  // Une seule, et seulement si elle est à ce destinataire : un identifiant qui
  // n'est pas le sien ne marque rien, sans le dire.
  markReadFor(
    recipientId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<void>;
}
