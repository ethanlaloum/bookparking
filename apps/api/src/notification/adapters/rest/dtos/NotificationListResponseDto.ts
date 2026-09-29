export interface NotificationResponseDto {
  id: string;
  kind: string;
  audience: string;
  createdAt: string;
  readAt: string | null;
  requestId: string;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
}

export interface NotificationListResponseDto {
  unreadCount: number;
  items: NotificationResponseDto[];
}
