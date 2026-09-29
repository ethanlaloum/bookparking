import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import {
  ListNotifications,
  NotificationList,
} from '../../../../domain/usecases/list-notifications/ListNotifications';
import { ForgetPushDevice } from '../../../../domain/usecases/forget-push-device/ForgetPushDevice';
import { MarkNotificationRead } from '../../../../domain/usecases/mark-notification-read/MarkNotificationRead';
import { MarkNotificationsRead } from '../../../../domain/usecases/mark-notifications-read/MarkNotificationsRead';
import { RegisterPushDevice } from '../../../../domain/usecases/register-push-device/RegisterPushDevice';
import { NotificationController } from './notification.controller';

export const createNotificationControllerSUT = () => {
  const listNotifications = new UseCaseDouble<
    { recipientId: string },
    Either.Either<NotificationList, UnknownError>
  >();
  const markNotificationsRead = new UseCaseDouble<
    { recipientId: string; readAt: Date },
    Either.Either<void, UnknownError>
  >();
  const registerPushDevice = new UseCaseDouble<
    { accountId: string; token: string; registeredAt: Date },
    Either.Either<void, UnknownError>
  >().willResolve(Either.right(undefined));
  const forgetPushDevice = new UseCaseDouble<
    { token: string },
    Either.Either<void, UnknownError>
  >().willResolve(Either.right(undefined));
  const markNotificationRead = new UseCaseDouble<
    { recipientId: string; notificationId: string; readAt: Date },
    Either.Either<void, UnknownError>
  >().willResolve(Either.right(undefined));
  const authState: TestAuthState = { user: null };

  const metadata: ModuleMetadata = {
    controllers: [NotificationController],
    providers: [
      { provide: ListNotifications, useValue: listNotifications },
      { provide: MarkNotificationsRead, useValue: markNotificationsRead },
      { provide: MarkNotificationRead, useValue: markNotificationRead },
      { provide: RegisterPushDevice, useValue: registerPushDevice },
      { provide: ForgetPushDevice, useValue: forgetPushDevice },
    ],
  };

  return {
    metadata,
    authState,

    givenSignedInAs(accountId: string) {
      authState.user = { id: accountId };
    },

    givenTheListIs(list: NotificationList) {
      listNotifications.willResolve(Either.right(list));
    },

    givenTheListFails() {
      listNotifications.willResolve(
        Either.left(new UnknownError('connection refused on 10.0.0.12')),
      );
    },

    givenMarkingSucceeds() {
      markNotificationsRead.willResolve(Either.right(undefined));
    },

    thenListWasReadFor(accountId: string) {
      expect(listNotifications.calls).toEqual([{ recipientId: accountId }]);
    },

    thenMarkedReadFor(accountId: string) {
      expect(
        markNotificationsRead.calls.map((call) => call.recipientId),
      ).toEqual([accountId]);
    },

    thenPhoneWasRegistered(accountId: string, token: string) {
      expect(
        registerPushDevice.calls.map((call) => ({
          accountId: call.accountId,
          token: call.token,
        })),
      ).toEqual([{ accountId, token }]);
    },

    thenPhoneWasForgotten(token: string) {
      expect(forgetPushDevice.calls).toEqual([{ token }]);
    },

    thenNoPhoneWasTouched() {
      expect(registerPushDevice.calls).toHaveLength(0);
      expect(forgetPushDevice.calls).toHaveLength(0);
    },

    thenOneMarkedReadFor(accountId: string, notificationId: string) {
      expect(
        markNotificationRead.calls.map((call) => ({
          recipientId: call.recipientId,
          notificationId: call.notificationId,
        })),
      ).toEqual([{ recipientId: accountId, notificationId }]);
      expect(markNotificationsRead.calls).toHaveLength(0);
    },

    thenNoneMarkedRead() {
      expect(markNotificationRead.calls).toHaveLength(0);
    },

    thenNothingWasRead() {
      expect(listNotifications.calls).toHaveLength(0);
      expect(markNotificationsRead.calls).toHaveLength(0);
    },
  };
};
