import { DEFAULT_PLATFORM_SETTINGS } from '../../../../shared/platform-settings/domain/entities/PlatformSettings';
import { OwnerPayoutView } from '../../../domain/entities/OwnerPayout';
import { releaseAtOf } from '../../../domain/entities/OwnerPayout';
import { PayoutAccount } from '../../../domain/entities/PayoutAccount';
import {
  DuePayout,
  OwnerTransfer,
  PayoutRepository,
} from '../../../domain/ports/PayoutRepository';

// Une location telle que la base la montre au contexte `payout` : la demande,
// son annonce, et si l'argent est prélevé (`CAPTURED`) chez Stripe.
export interface RentalForPayout {
  requestId: string;
  ownerId: string;
  paymentId: string;
  captured: boolean;
  priceInCents: number;
  platformFeeInCents: number | null;
  startsAt: Date;
  arrivedAt: Date | null;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
  // Absent, le délai d'avant le back-office, comme le défaut de la colonne.
  releaseDelayInHours?: number;
  disputed?: boolean;
  refundInCents?: number;
}

const releaseDelayOf = (rental: RentalForPayout): number =>
  rental.releaseDelayInHours ??
  DEFAULT_PLATFORM_SETTINGS.payoutReleaseDelayHours;

export class InMemoryPayoutRepository implements PayoutRepository {
  public accounts = new Map<string, PayoutAccount>();
  public emails = new Map<string, string>();
  public rentals: RentalForPayout[] = [];
  public transfers: OwnerTransfer[] = [];

  public async findAccount(accountId: string): Promise<PayoutAccount | null> {
    const account = this.accounts.get(accountId);
    return account === undefined ? null : { ...account };
  }

  public async createAccount(account: PayoutAccount): Promise<void> {
    if (!this.accounts.has(account.accountId))
      this.accounts.set(account.accountId, { ...account });
  }

  public async setPayoutsEnabled(
    accountId: string,
    payoutsEnabled: boolean,
  ): Promise<void> {
    const account = this.accounts.get(accountId);
    if (account !== undefined) account.payoutsEnabled = payoutsEnabled;
  }

  public async findEmailOf(accountId: string): Promise<string | null> {
    return this.emails.get(accountId) ?? null;
  }

  public async findPayoutsForOwner(
    ownerId: string,
  ): Promise<OwnerPayoutView[]> {
    return this.rentals
      .filter((rental) => rental.ownerId === ownerId)
      .filter((rental) => rental.captured || this.transferOf(rental.requestId))
      .map((rental) => {
        const transfer = this.transferOf(rental.requestId);
        return {
          requestId: rental.requestId,
          address: rental.address,
          box: rental.box,
          fromDay: rental.fromDay,
          toDay: rental.toDay,
          priceInCents: rental.priceInCents,
          platformFeeInCents: rental.platformFeeInCents,
          startsAt: rental.startsAt,
          arrivedAt: rental.arrivedAt,
          transferredAt: transfer?.transferredAt ?? null,
          transferredAmountInCents: transfer?.amountInCents ?? null,
          releaseDelayInHours: releaseDelayOf(rental),
          disputed: rental.disputed ?? false,
          refundInCents: rental.refundInCents ?? 0,
        };
      });
  }

  public async findDuePayouts(now: Date, limit: number): Promise<DuePayout[]> {
    return this.rentals
      .filter((rental) => rental.captured && !this.transferOf(rental.requestId))
      .filter((rental) => rental.disputed !== true)
      .filter(
        (rental) =>
          releaseAtOf(
            rental.startsAt,
            rental.arrivedAt,
            releaseDelayOf(rental),
          ).getTime() <= now.getTime(),
      )
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, limit)
      .map((rental) => {
        const account = this.accounts.get(rental.ownerId);
        return {
          requestId: rental.requestId,
          ownerId: rental.ownerId,
          paymentId: rental.paymentId,
          priceInCents: rental.priceInCents,
          platformFeeInCents: rental.platformFeeInCents,
          refundInCents: rental.refundInCents ?? 0,
          account: account === undefined ? null : { ...account },
        };
      });
  }

  public async recordTransfer(transfer: OwnerTransfer): Promise<void> {
    if (this.transferOf(transfer.requestId)) return;
    this.transfers.push(transfer);
  }

  private transferOf(requestId: string): OwnerTransfer | undefined {
    return this.transfers.find((transfer) => transfer.requestId === requestId);
  }
}
