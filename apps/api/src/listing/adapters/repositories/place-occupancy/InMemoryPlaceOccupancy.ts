import { StayDays } from '../../../domain/entities/StayDays';
import { PlaceOccupancy } from '../../../domain/ports/PlaceOccupancy';

export class InMemoryPlaceOccupancy implements PlaceOccupancy {
  public takenPlaceKeys: string[] = [];
  public readonly asked: { stay: StayDays; viewerId: string | null }[] = [];

  public async findPlaceKeysTakenDuring(
    stay: StayDays,
    viewerId: string | null,
  ): Promise<string[]> {
    this.asked.push({ stay, viewerId });
    return this.takenPlaceKeys;
  }
}
