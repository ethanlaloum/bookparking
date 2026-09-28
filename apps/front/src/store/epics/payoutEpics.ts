import { openStripePageEpic } from '../../app/payout/domain/use-cases/open-stripe-page/openStripePageEpic';
import { readPayoutsEpic } from '../../app/payout/domain/use-cases/read-payouts/readPayoutsEpic';

export const payoutEpics = [readPayoutsEpic, openStripePageEpic];
