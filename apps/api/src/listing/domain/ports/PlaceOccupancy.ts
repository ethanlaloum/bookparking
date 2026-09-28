import { StayDays } from '../entities/StayDays';

export interface PlaceOccupancy {
  findPlaceKeysTakenDuring(
    stay: StayDays,
    viewerId: string | null,
  ): Promise<string[]>;
}
