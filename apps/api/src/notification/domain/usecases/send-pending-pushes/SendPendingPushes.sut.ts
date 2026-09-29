import { Either } from 'effect/index';

import { NotificationKind } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { InMemoryPushDeviceRepository } from '../../../adapters/repositories/push-device/InMemoryPushDeviceRepository';
import { InMemoryPushQueue } from '../../../adapters/repositories/push-queue/InMemoryPushQueue';
import { InMemoryPushSender } from '../../../adapters/services/push-sender/InMemoryPushSender';
import { NotificationAudience } from '../../entities/NotificationView';
import { SendPendingPushes } from './SendPendingPushes';

export const createSendPendingPushesSUT = () => {
  const devices = new InMemoryPushDeviceRepository();
  const queue = new InMemoryPushQueue(devices);
  const sender = new InMemoryPushSender();
  const sendPendingPushes = new SendPendingPushes(queue, devices, sender);
  let sequence = 0;

  return {
    givenPhone(accountId: string, token: string) {
      devices.accountIdByToken.set(token, accountId);
    },

    givenNotification(params: {
      recipientId: string;
      kind: NotificationKind;
      audience: NotificationAudience;
      createdAt: string;
    }): string {
      sequence += 1;
      const notificationId = `notification-${sequence}`;
      queue.notifications.push({
        notificationId,
        kind: params.kind,
        audience: params.audience,
        recipientId: params.recipientId,
        createdAt: new Date(params.createdAt),
        pushedAt: null,
      });
      return notificationId;
    },

    givenExpoDoesNotAnswer() {
      sender.unavailable = true;
    },

    givenExpoAnswersAgain() {
      sender.unavailable = false;
    },

    givenTheAppWasUninstalledFrom(token: string) {
      sender.goneTokens.add(token);
    },

    async whenSweepingAt(now: string) {
      const result = await sendPendingPushes.execute({ now: new Date(now) });
      if (Either.isLeft(result)) throw result.left;
      return result.right;
    },

    thenExpoReceived(
      expected: { to: string; title: string; data: Record<string, string> }[],
    ) {
      expect(
        sender.received.map(({ to, title, data }) => ({ to, title, data })),
      ).toEqual(expected);
    },

    thenNothingWasPushed() {
      expect(sender.received).toEqual([]);
    },

    thenPushedAtAre(expected: Record<string, string | null>) {
      expect(
        Object.fromEntries(
          queue.notifications.map((notification) => [
            notification.notificationId,
            notification.pushedAt?.toISOString() ?? null,
          ]),
        ),
      ).toEqual(expected);
    },

    thenPhonesAre(expected: Record<string, string>) {
      expect(Object.fromEntries(devices.accountIdByToken)).toEqual(expected);
    },
  };
};
