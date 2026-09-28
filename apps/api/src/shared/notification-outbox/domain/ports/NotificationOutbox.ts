import { GenericTransaction } from '../../../unit-of-work/GenericTransaction';
import { Notification } from '../entities/Notification';

// Chaque contexte prévient ici, dans la transaction du moment qu'il écrit, sans
// importer `notification/`. Une notification ne naît qu'une fois par demande,
// par type et par destinataire : rejouée, elle n'écrit rien, ni dans la cloche
// ni dans la file d'e-mails.
export interface NotificationOutbox {
  notify(notification: Notification, trx?: GenericTransaction): Promise<void>;
}
