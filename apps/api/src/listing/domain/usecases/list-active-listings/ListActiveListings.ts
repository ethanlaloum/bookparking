import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Listing } from '../../entities/Listing';
import { ListingRepository } from '../../ports/ListingRepository';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
const FIRST_PAGE = 1;

interface Props {
  place?: string;
  from?: Date;
  to?: Date;
  page?: number;
  size?: number;
}

export interface ListedActiveListings {
  listings: Listing[];
  total: number;
  page: number;
  size: number;
}

const boundedSize = (size?: number): number => {
  if (size === undefined || !Number.isFinite(size)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.trunc(size), 1), MAX_PAGE_SIZE);
};

const boundedPage = (page?: number): number => {
  if (page === undefined || !Number.isFinite(page)) return FIRST_PAGE;
  return Math.max(Math.trunc(page), FIRST_PAGE);
};

export class ListActiveListings implements UseCase<
  Props,
  Promise<Either.Either<ListedActiveListings, UnknownError>>
> {
  constructor(private readonly listingRepository: ListingRepository) {}

  public async execute(
    props: Props = {},
  ): Promise<Either.Either<ListedActiveListings, UnknownError>> {
    try {
      const active = await this.listingRepository.findAllActive();
      const matching = active.filter((listing) =>
        ListActiveListings.matches(listing, props),
      );

      const size = boundedSize(props.size);
      const page = boundedPage(props.page);
      const firstIndex = (page - 1) * size;

      return Either.right({
        listings: matching.slice(firstIndex, firstIndex + size),
        total: matching.length,
        page,
        size,
      });
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  private static matches(listing: Listing, props: Props): boolean {
    if (props.place !== undefined && !listing.addressCarries(props.place))
      return false;
    if (
      props.from !== undefined &&
      props.to !== undefined &&
      !listing.availabilityCovers(props.from, props.to)
    )
      return false;
    return true;
  }
}
