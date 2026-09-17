import { RentalPeriod } from '../services/computeRentalPrice';
import { designatesSamePlace, RentalPlace } from './RentalPlace';

interface Props {
  renterId: string;
  address: string;
  box: string;
  period: RentalPeriod;
}

export class ConfirmedRental {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): ConfirmedRental {
    return new ConfirmedRental(state);
  }

  public designates(place: RentalPlace): boolean {
    return designatesSamePlace(
      { address: this.props.address, box: this.props.box },
      place,
    );
  }

  public overlaps(period: RentalPeriod): boolean {
    return (
      this.props.period.from.getTime() <= period.to.getTime() &&
      this.props.period.to.getTime() >= period.from.getTime()
    );
  }
}
