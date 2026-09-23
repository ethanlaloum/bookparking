import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { CalendarDay } from '../../entities/CalendarDay';
import {
  paymentPageExpiryOf,
  unpaidAbandonDeadlineAt,
} from '../../entities/RentalMoney';
import { RentalRequest } from '../../entities/RentalRequest';
import { PaymentUnavailableError } from '../../errors/PaymentUnavailableError';
import { InvalidRequestedPeriodError } from '../../errors/InvalidRequestedPeriodError';
import { NoPriceForRequestedPeriodError } from '../../errors/NoPriceForRequestedPeriodError';
import { RequestedPeriodTooLongError } from '../../errors/RequestedPeriodTooLongError';
import { PaymentGateway } from '../../ports/PaymentGateway';
import { PublishedListingReader } from '../../ports/PublishedListingReader';
import { RentalRepository } from '../../ports/RentalRepository';
import { DatesAlreadyRentedError } from './errors/DatesAlreadyRentedError';
import { ListingNotPublishedError } from './errors/ListingNotPublishedError';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export interface RequestedRental {
  rentalRequest: RentalRequest;
  checkoutUrl: string;
}

interface Props {
  renterId: string;
  address: string;
  box: string;
  fromDay: CalendarDay;
  toDay: CalendarDay;
  requestedAt: Date;
}

export class RequestRental implements UseCase<
  Props,
  Promise<
    Either.Either<
      RequestedRental,
      | DatesAlreadyRentedError
      | InvalidRequestedPeriodError
      | ListingNotPublishedError
      | NoPriceForRequestedPeriodError
      | PaymentUnavailableError
      | RequestedPeriodTooLongError
      | UnknownError
    >
  >
> {
  constructor(
    private readonly publishedListingReader: PublishedListingReader,
    private readonly rentalRepository: RentalRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly requestExpiryInHours: number,
  ) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<
      RequestedRental,
      | DatesAlreadyRentedError
      | InvalidRequestedPeriodError
      | ListingNotPublishedError
      | NoPriceForRequestedPeriodError
      | PaymentUnavailableError
      | RequestedPeriodTooLongError
      | UnknownError
    >
  > {
    try {
      const place = { address: props.address, box: props.box };

      const publishedListing =
        await this.publishedListingReader.findPublishedByPlace(place);
      if (!publishedListing) return Either.left(new ListingNotPublishedError());

      // The request is built first because RentalRequest.request is the only
      // place that refuses an unreadable pair of days. Checking availability
      // before it means feeding a NaN period to overlaps(), where every
      // comparison is false: the place reads as free whatever is booked, and
      // the priceless request that follows is recorded.
      const rentalRequest = RentalRequest.request({
        renterId: props.renterId,
        address: publishedListing.address,
        box: publishedListing.box,
        days: { from: props.fromDay, to: props.toDay },
        pricing: publishedListing.pricing,
        requestedAt: props.requestedAt,
      });
      if (Either.isLeft(rentalRequest)) return Either.left(rentalRequest.left);

      // Les demandes périmées sont retirées du chemin avant toute lecture de
      // disponibilité : c'est le seul déclencheur de l'expiration, et donc ce
      // qui dégèle une place qu'un loueur n'a jamais confirmée. Une demande
      // périmée que personne ne bouscule reste PENDING en base jusqu'à la
      // prochaine demande sur n'importe quelle place.
      // Le balayage périodique fait déjà ce travail ; le refaire ici libère des
      // dates échues à l'instant précis où quelqu'un les veut, sans attendre
      // son prochain passage. L'argent dû, lui, reste au balayage.
      const expiryDeadline = new Date(
        props.requestedAt.getTime() -
          this.requestExpiryInHours * MILLISECONDS_PER_HOUR,
      );
      await this.rentalRepository.expireRequestsPendingSince(expiryDeadline);
      await this.rentalRepository.expireHoldsPlacedSince(expiryDeadline);
      await this.rentalRepository.abandonUnpaidRequestsSince(
        unpaidAbandonDeadlineAt(props.requestedAt),
      );

      const confirmedRentals =
        await this.rentalRepository.findConfirmedByPlace(place);
      if (
        confirmedRentals.some((rental) =>
          rental.overlaps(rentalRequest.right.period),
        )
      )
        return Either.left(new DatesAlreadyRentedError());

      await this.rentalRepository.createRequest(rentalRequest.right);

      // La ligne est écrite avant d'ouvrir la page : c'est elle qui retient les
      // dates pendant que le conducteur paie. Si Stripe ne répond pas, elle est
      // abandonnée aussitôt, faute de quoi elle bloquerait la place deux heures
      // pour un paiement que personne ne pourra jamais faire.
      const { id, priceInCents } = rentalRequest.right.toState();
      try {
        const page = await this.paymentGateway.openPaymentPage({
          requestId: id,
          amountInCents: priceInCents,
          expiresAt: paymentPageExpiryOf(props.requestedAt),
        });
        await this.rentalRepository.attachPaymentPage(
          id,
          page.checkoutSessionId,
        );
        return Either.right({
          rentalRequest: rentalRequest.right,
          checkoutUrl: page.checkoutUrl,
        });
      } catch (error: unknown) {
        if (!(error instanceof PaymentUnavailableError)) throw error;
        await this.rentalRepository.markAbandoned(id);
        return Either.left(error);
      }
    } catch (error: unknown) {
      if (
        error instanceof DatesAlreadyRentedError ||
        error instanceof ListingNotPublishedError
      )
        return Either.left(error);
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
