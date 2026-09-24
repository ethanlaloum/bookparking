export interface SchemaEmailOutbox {
  id: string;
  kind: string;
  recipient: string;
  status: string;
  attempts: number;
  queued_at: Date | string;
  sent_at: Date | string | null;
  failed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}
