export interface PayoutLineResponseDto {
  requestId: string;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  amountInCents: number;
  status: string;
  releaseAt: string;
  transferredAt: string | null;
}

export interface PayoutSummaryResponseDto {
  accountStatus: string;
  feePercent: number;
  upcomingInCents: number;
  sentInCents: number;
  payouts: PayoutLineResponseDto[];
}

export interface StripeLinkResponseDto {
  url: string;
}
