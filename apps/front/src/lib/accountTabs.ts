import type { NotificationDestination } from '../app/notification/domain/entities/Notification';

// L'onglet du compte qu'une adresse ouvre : `/compte?onglet=demandes-recues`.
// Les e-mails de notification de l'api écrivent ces mêmes adresses
// (`composeEmail.ts`) — changer un nom ici casse leurs liens.
export const ACCOUNT_TAB_PARAM = 'onglet';

export const ACCOUNT_TAB_SLUG: Record<NotificationDestination, string> = {
  received: 'demandes-recues',
  mine: 'reservations',
  payouts: 'versements',
};

export const accountHrefOf = (destination: NotificationDestination): string =>
  `/compte?${ACCOUNT_TAB_PARAM}=${ACCOUNT_TAB_SLUG[destination]}`;

export const accountTabOfSlug = (slug: string | null): NotificationDestination | null => {
  const found = (Object.keys(ACCOUNT_TAB_SLUG) as NotificationDestination[]).find(
    (destination) => ACCOUNT_TAB_SLUG[destination] === slug,
  );
  return found ?? null;
};
