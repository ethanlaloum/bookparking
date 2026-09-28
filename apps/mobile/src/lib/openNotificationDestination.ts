import { router } from 'expo-router';

import type { NotificationDestination } from '@front/app/notification/domain/entities/Notification';
import { ACCOUNT_TAB_PARAM, ACCOUNT_TAB_SLUG } from '@front/lib/accountTabs';

// Le loueur retrouve ses demandes reçues dans l'onglet Compte, le conducteur
// ses réservations dans leur propre onglet — la même règle que le site. La
// cloche et le push mènent ici tous les deux.
export const openNotificationDestination = (destination: NotificationDestination): void => {
  if (destination === 'mine') router.navigate('/reservations');
  else router.navigate({ pathname: '/compte', params: { [ACCOUNT_TAB_PARAM]: ACCOUNT_TAB_SLUG[destination] } });
};

// Les données d'un push viennent de l'api (`SendPendingPushes`) : rien d'autre
// qu'une destination connue n'ouvre un écran.
export const destinationOfPush = (data: unknown): NotificationDestination | null => {
  if (typeof data !== 'object' || data === null) return null;
  const destination = (data as { destination?: unknown }).destination;
  return destination === 'received' || destination === 'mine' || destination === 'payouts' ? destination : null;
};
