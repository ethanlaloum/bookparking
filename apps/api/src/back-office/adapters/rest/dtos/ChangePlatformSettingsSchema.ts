import { Schema } from 'effect/index';

// Le corps ne vérifie que la forme : les bornes et le motif sont des règles du
// domaine (`checkPlatformSettings`, `isUsableReason`), dont les refus portent
// leur propre message.
export const ChangePlatformSettingsSchema = Schema.Struct({
  platformFeePercent: Schema.Number,
  freeCancellationHours: Schema.Number,
  requestExpiryHours: Schema.Number,
  payoutReleaseDelayHours: Schema.Number,
  reason: Schema.String,
});
