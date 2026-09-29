export interface SchemaPlatformSettings {
  id: string;
  // `numeric` : le pilote pg le rend en chaîne.
  platform_fee_percent: number | string;
  free_cancellation_hours: number;
  request_expiry_hours: number;
  payout_release_delay_hours: number;
  effective_from: Date;
  changed_by: string | null;
  reason: string | null;
}
