import { CalendarDayRange, parisPeriodOfDays } from '../entities/CalendarDay';
import { ConfirmedRental } from '../entities/ConfirmedRental';
import { RentalPeriod } from '../services/computeRentalPrice';

export class ConfirmedRentalBuilder {
  private state: ConfirmedRental;

  constructor() {
    this.state = ConfirmedRental.fromState({
      renterId: 'account-lea',
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      period: parisPeriodOfDays({ from: '2026-10-01', to: '2026-10-31' }),
    });
  }

  withRenterId(renterId: string): ConfirmedRentalBuilder {
    this.state = ConfirmedRental.fromState({
      ...this.state.toState(),
      renterId,
    });
    return this;
  }

  withAddress(address: string): ConfirmedRentalBuilder {
    this.state = ConfirmedRental.fromState({
      ...this.state.toState(),
      address,
    });
    return this;
  }

  withBox(box: string): ConfirmedRentalBuilder {
    this.state = ConfirmedRental.fromState({ ...this.state.toState(), box });
    return this;
  }

  withPeriod(period: RentalPeriod): ConfirmedRentalBuilder {
    this.state = ConfirmedRental.fromState({ ...this.state.toState(), period });
    return this;
  }

  withDays(days: CalendarDayRange): ConfirmedRentalBuilder {
    return this.withPeriod(parisPeriodOfDays(days));
  }

  build(): ConfirmedRental {
    return this.state;
  }
}
