export interface SchemaNotificationOutbox {
  id: string;
  kind: string;
  recipient_id: string;
  rental_request_id: string;
  created_at: Date | string;
  read_at: Date | string | null;
}
