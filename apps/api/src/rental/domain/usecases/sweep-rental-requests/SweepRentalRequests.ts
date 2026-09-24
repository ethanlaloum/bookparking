import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  holdExpiryDeadlineAt,
  unpaidAbandonDeadlineAt,
} from '../../entities/RentalMoney';
import { PaymentGateway } from '../../ports/PaymentGateway';
import { RentalRepository } from '../../ports/RentalRepository';
import { settleMoneyOwed } from '../../services/settleMoneyOwed';

interface Props {
  now: Date;
}

export interface SweepReport {
  abandoned: number;
  expired: number;
  settled: number;
  stillOwed: number;
}

export class SweepRentalRequests implements UseCase<
  Props,
  Promise<Either.Either<SweepReport, UnknownError>>
> {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly requestExpiryInHours: number,
  ) {}

  // Les dettes sont relues après les expirations, dans le même passage : une
  // empreinte qui vient d'expirer est levée tout de suite, pas cinq minutes
  // plus tard. Une dette que Stripe n'éteint pas reste écrite et revient au
  // passage suivant, avec la même clé d'idempotence.
  public async execute(
    props: Props,
  ): Promise<Either.Either<SweepReport, UnknownError>> {
    try {
      const abandoned = await this.rentalRepository.abandonUnpaidRequestsSince(
        unpaidAbandonDeadlineAt(props.now),
      );
      const deadline = holdExpiryDeadlineAt(
        props.now,
        this.requestExpiryInHours,
      );
      const expired =
        (await this.rentalRepository.expireHoldsPlacedSince(deadline)) +
        (await this.rentalRepository.expireRequestsPendingSince(deadline));

      let settled = 0;
      let stillOwed = 0;
      for (const owed of await this.rentalRepository.findMoneyOwed()) {
        const settlement = await settleMoneyOwed(
          owed,
          this.rentalRepository,
          this.paymentGateway,
          props.now,
        );
        if (settlement === 'SETTLED') settled += 1;
        else stillOwed += 1;
      }

      return Either.right({ abandoned, expired, settled, stillOwed });
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
