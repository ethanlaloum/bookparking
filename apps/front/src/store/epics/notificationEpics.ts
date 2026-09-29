import { listNotificationsEpic } from '../../app/notification/domain/use-cases/list-notifications/listNotificationsEpic';
import {
  forgetPushDeviceEpic,
  forgetPushDeviceOnSignOutEpic,
} from '../../app/notification/domain/use-cases/forget-push-device/forgetPushDeviceEpic';
import { markNotificationReadEpic } from '../../app/notification/domain/use-cases/mark-notification-read/markNotificationReadEpic';
import { markNotificationsReadEpic } from '../../app/notification/domain/use-cases/mark-notifications-read/markNotificationsReadEpic';
import { registerPushDeviceEpic } from '../../app/notification/domain/use-cases/register-push-device/registerPushDeviceEpic';

export const notificationEpics = [
  listNotificationsEpic,
  markNotificationsReadEpic,
  markNotificationReadEpic,
  registerPushDeviceEpic,
  forgetPushDeviceOnSignOutEpic,
  forgetPushDeviceEpic,
];
