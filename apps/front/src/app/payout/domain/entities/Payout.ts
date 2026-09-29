import type { components } from '../../../../api/schema';

export type PayoutSummary = components['schemas']['PayoutSummary'];
export type PayoutLine = components['schemas']['PayoutLine'];
export type PayoutAccountStatus = PayoutSummary['accountStatus'];
export type PayoutStatus = PayoutLine['status'];

// Ce que le loueur garde, en pourcentage, pour l'afficher sans calcul : la
// commission vient de l'api, jamais d'une constante de l'écran.
export const ownerPercentOf = (summary: PayoutSummary): number => 100 - summary.feePercent;

// Des versements attendent des coordonnées bancaires : l'écran le dit ailleurs
// que dans l'onglet, pour que le loueur ne l'apprenne pas trop tard.
export const moneyWaitsForBankDetails = (summary: PayoutSummary | null): boolean =>
  summary !== null &&
  summary.accountStatus !== 'READY' &&
  summary.payouts.some((payout) => payout.status !== 'SENT');
