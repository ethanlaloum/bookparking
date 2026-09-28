import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { ForgetPushDevice } from '../../../../domain/usecases/forget-push-device/ForgetPushDevice';
import { ListNotifications } from '../../../../domain/usecases/list-notifications/ListNotifications';
import { MarkNotificationRead } from '../../../../domain/usecases/mark-notification-read/MarkNotificationRead';
import { MarkNotificationsRead } from '../../../../domain/usecases/mark-notifications-read/MarkNotificationsRead';
import { RegisterPushDevice } from '../../../../domain/usecases/register-push-device/RegisterPushDevice';
import { NotificationMapper } from '../../../mappers/NotificationMapper';
import { NotificationListResponseDto } from '../../dtos/NotificationListResponseDto';
import { PushDeviceSchema } from '../../dtos/PushDeviceSchema';

const decodePushDevice = (body: unknown): { token: string } => {
  const decode = Schema.decodeUnknownEither(PushDeviceSchema)(body);
  if (Either.isLeft(decode))
    throw new HttpException(
      parseSchemaError(decode.left),
      HttpStatus.BAD_REQUEST,
    );
  return decode.right;
};

// La cloche ne prend aucun identifiant : un compte ne lit et ne marque que
// ses propres notifications, celles du jeton. Les téléphones, eux, sont
// désignés par leur jeton de push.
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly listNotificationsUseCase: ListNotifications,
    private readonly markNotificationsReadUseCase: MarkNotificationsRead,
    private readonly markNotificationReadUseCase: MarkNotificationRead,
    private readonly registerPushDeviceUseCase: RegisterPushDevice,
    private readonly forgetPushDeviceUseCase: ForgetPushDevice,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  public async list(
    @Req() req: TokenRequest,
  ): Promise<NotificationListResponseDto | void> {
    try {
      const result = await this.listNotificationsUseCase.execute({
        recipientId: req.user.id,
      });
      if (Either.isLeft(result))
        throw new HttpException(
          'Vos notifications sont indisponibles',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      return NotificationMapper.toListDto(result.right);
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'NotificationController',
        method: 'list',
        userId: req.user.id,
      });
    }
  }

  @Post('read')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async markAllRead(@Req() req: TokenRequest): Promise<void> {
    try {
      const result = await this.markNotificationsReadUseCase.execute({
        recipientId: req.user.id,
        readAt: new Date(),
      });
      if (Either.isLeft(result))
        throw new HttpException(
          "Vos notifications n'ont pas pu être marquées comme lues",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'NotificationController',
        method: 'markAllRead',
        userId: req.user.id,
      });
    }
  }

  // Déclarée après `POST read` : Nest confronte dans l'ordre, et `read` n'est
  // pas un UUID. Un identifiant mal formé, inconnu ou d'un autre compte répond
  // 204 comme les autres : rien ne dit qu'une notification existe.
  @Post(':id/read')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async markOneRead(
    @Req() req: TokenRequest,
    @Param('id') id: string,
  ): Promise<void> {
    try {
      const decoded = Schema.decodeUnknownEither(Schema.UUID)(id);
      if (Either.isLeft(decoded)) return;
      const result = await this.markNotificationReadUseCase.execute({
        recipientId: req.user.id,
        notificationId: decoded.right,
        readAt: new Date(),
      });
      if (Either.isLeft(result))
        throw new HttpException(
          "Cette notification n'a pas pu être marquée comme lue",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'NotificationController',
        method: 'markOneRead',
        userId: req.user.id,
      });
    }
  }

  // L'app enregistre son téléphone à chaque session ouverte.
  @Post('push-device')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async registerPushDevice(
    @Req() req: TokenRequest,
    @Body() body: unknown,
  ): Promise<void> {
    try {
      const { token } = decodePushDevice(body);
      const result = await this.registerPushDeviceUseCase.execute({
        accountId: req.user.id,
        token,
        registeredAt: new Date(),
      });
      if (Either.isLeft(result))
        throw new HttpException(
          "Ce téléphone n'a pas pu être enregistré",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'NotificationController',
        method: 'registerPushDevice',
        userId: req.user.id,
      });
    }
  }

  // Sans garde : l'app l'appelle en se déconnectant, quand la session est
  // peut-être déjà effacée. Répond 204 que le jeton soit connu ou non.
  @Post('push-device/removal')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async forgetPushDevice(@Body() body: unknown): Promise<void> {
    try {
      const { token } = decodePushDevice(body);
      const result = await this.forgetPushDeviceUseCase.execute({ token });
      if (Either.isLeft(result))
        throw new HttpException(
          "Ce téléphone n'a pas pu être oublié",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'NotificationController',
        method: 'forgetPushDevice',
      });
    }
  }
}
