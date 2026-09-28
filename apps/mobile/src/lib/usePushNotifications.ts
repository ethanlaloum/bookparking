import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { listNotificationsRequested } from '@front/app/notification/domain/use-cases/list-notifications/listNotificationsEpic';
import { registerPushDeviceRequested } from '@front/app/notification/domain/use-cases/register-push-device/registerPushDeviceEpic';
import { selectIsAuthenticated } from '@front/selectors/auth/authSelectors';

import { useAppDispatch, useAppSelector } from '../store/redux';
import { destinationOfPush, openNotificationDestination } from './openNotificationDestination';

// Au premier plan, un push s'affiche comme en arrière-plan : bannière et liste,
// sans son — l'app ouverte n'a pas à sonner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// L'identifiant du projet EAS, écrit dans `app.json` par `eas init` : sans lui,
// Expo ne sait pas pour quelle app délivrer un jeton.
const projectIdOf = (): string | null => {
  const fromEas = Constants.easConfig?.projectId;
  if (fromEas !== undefined) return fromEas;
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? null;
};

// Expo Go ne reçoit aucun push : il faut la « development build » d'EAS, qui
// porte la clé Apple du projet. Dans Expo Go, la cloche suffit.
const pushIsPossible = (): boolean =>
  Platform.OS === 'ios' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// iOS ne pose la question qu'une fois : un refus est définitif tant que
// l'utilisateur ne revient pas dessus dans Réglages.
const obtainPushToken = async (projectId: string): Promise<string | null> => {
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};

/**
 * Le push de l'app. À chaque session ouverte, le jeton du téléphone part à
 * l'api ; la déconnexion l'y fait oublier (`forgetPushDeviceOnSignOutEpic`).
 * Un push reçu relit la cloche ; un push touché ouvre l'écran qu'il concerne,
 * y compris quand il a réveillé l'app.
 */
export const usePushNotifications = (): void => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !pushIsPossible()) return;
    const projectId = projectIdOf();
    if (projectId === null) {
      console.warn('[push] Aucun projet EAS dans app.json : lancez `eas init` dans apps/mobile.');
      return;
    }
    let cancelled = false;
    // Hors ligne, Expo ne rend pas de jeton : nouvel essai à la prochaine session.
    obtainPushToken(projectId)
      .then((token) => {
        if (token !== null && !cancelled) dispatch(registerPushDeviceRequested({ token }));
      })
      .catch((error: unknown) => {
        console.warn('[push] Jeton indisponible', error instanceof Error ? error.message : error);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Les écouteurs n'existent que sur le téléphone : l'aperçu web n'a pas le
    // module natif.
    if (Platform.OS !== 'ios') return;
    const open = (response: Notifications.NotificationResponse): void => {
      const destination = destinationOfPush(response.notification.request.content.data);
      if (destination !== null) openNotificationDestination(destination);
      dispatch(listNotificationsRequested());
    };

    const received = Notifications.addNotificationReceivedListener(() => {
      dispatch(listNotificationsRequested());
    });
    const opened = Notifications.addNotificationResponseReceivedListener(open);

    try {
      const wokeTheApp = Notifications.getLastNotificationResponse();
      if (wokeTheApp !== null) {
        open(wokeTheApp);
        Notifications.clearLastNotificationResponse();
      }
    } catch (error: unknown) {
      console.warn('[push] Dernier push touché illisible', error instanceof Error ? error.message : error);
    }

    return () => {
      received.remove();
      opened.remove();
    };
  }, [dispatch]);
};
