import { NotificationList } from '../../domain/usecases/list-notifications/ListNotifications';
import { NotificationListResponseDto } from '../rest/dtos/NotificationListResponseDto';

// Le destinataire ne traverse pas : la route est clée sur le compte qui
// appelle, et aucune autre partie de la demande n'est nommée.
export class NotificationMapper {
  public static toListDto(list: NotificationList): NotificationListResponseDto {
    return {
      unreadCount: list.unreadCount,
      items: list.items.map((item) => ({
        id: item.id,
        kind: item.kind,
        audience: item.audience,
        createdAt: item.createdAt.toISOString(),
        readAt: item.readAt === null ? null : item.readAt.toISOString(),
        requestId: item.requestId,
        address: item.address,
        box: item.box,
        fromDay: item.fromDay,
        toDay: item.toDay,
      })),
    };
  }
}
