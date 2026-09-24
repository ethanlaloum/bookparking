import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { CalendarDay } from '../../entities/CalendarDay';
import {
  paymentPageExpiryOf,
  unpaidAbandonDeadlineAt,
} from '../../entities/RentalMoney';
import { placeKeyOf } from '../../entities/RentalPlace';
import { RentalRequest } from '../../entities/RentalRequest';
import { PaymentUnavailableError } from '../../errors/PaymentUnavailableError';
import { InvalidRequestedPeriodError } from '../../errors/InvalidRequestedPeriodError';
import { NoPriceForRequestedPeriodError } from '../../errors/NoPriceForRequestedPeriodError';
import { RequestedPeriodTooLongError } from '../../errors/RequestedPeriodTooLongError';
import { PaymentGateway } from '../../ports/PaymentGateway';
import { PublishedListingReader } from '../../ports/PublishedListingReader';
import {
  IdempotentRentalRequest,
  RentalRepository,
} from '../../ports/RentalRepository';
import { DatesAlreadyRentedError } from './errors/DatesAlreadyRentedError';
import { DuplicateIdempotencyKeyError } from './errors/DuplicateIdempotencyKeyError';
import { IdempotencyKeyReusedError } from './errors/IdempotencyKeyReusedError';
import { ListingNotPublishedError } from './errors/ListingNotPublishedError';
import { RentalRequestBeingCreatedError } from './errors/RentalRequestBeingCreatedError';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export interface RequestedRental {
  rentalRequest: RentalRequest;
  checkoutUrl: string;
  replayed: boolean;
}

interface Props {
  renterId: string;
  address: string;
  box: string;
  fromDay: CalendarDay;
  toDay: CalendarDay;
  requestedAt: Date;
  idempotencyKey: string;
}

export class RequestRental implements UseCase<
  Props,
  Promise<
    Either.Either<
      RequestedRental,
      | DatesAlreadyRentedError
      | IdempotencyKeyReusedError
      | InvalidRequestedPeriodError
      | ListingNotPublishedError
      | NoPriceForRequestedPeriodError
      | PaymentUnavailableError
      | RentalRequestBeingCreatedError
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
    private readonly freeCancellationHours: number,
  ) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<
      RequestedRental,
      | DatesAlreadyRentedError
      | IdempotencyKeyReusedError
      | InvalidRequestedPeriodError
      | ListingNotPublishedError
      | NoPriceForRequestedPeriodError
      | PaymentUnavailableError
      | RentalRequestBeingCreatedError
      | RequestedPeriodTooLongError
      | UnknownError
    >
  > {
    try {
      const place = { address: props.address, box: props.box };

      // Une intention déjà envoyée par ce compte rend ce qu'elle a rendu la
      // première fois : la même demande, la même page de paiement. Le
      // conducteur qui clique deux fois, ou dont le navigateur a perdu la
      // réponse, ne crée jamais une seconde demande.
      const previous = await this.rentalRepository.findByIdempotencyKey(
        props.renterId,
        props.idempotencyKey,
      );
      if (previous) return RequestRental.replay(previous, props);

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
        idempotencyKey: props.idempotencyKey,
        freeCancellationHours: this.freeCancellationHours,
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

      // Un conducteur n'est jamais bloqué par sa propre demande impayée :
      // redemander la même place remplace celle qu'il a laissée ouverte — onglet
      // fermé, page de Stripe quittée sans son lien de retour. Sa page est
      // fermée par précaution ; une empreinte posée malgré tout sera levée à
      // son arrivée, comme sur toute demande abandonnée.
      const replaced =
        await this.rentalRepository.abandonOwnUnpaidRequestsOverlapping(
          props.renterId,
          place,
          rentalRequest.right.period,
        );
      for (const { checkoutSessionId } of replaced) {
        if (checkoutSessionId === null) continue;
        try {
          await this.paymentGateway.closePaymentPage(checkoutSessionId);
        } catch {
          /* voir ci-dessus */
        }
      }

      const confirmedRentals =
        await this.rentalRepository.findConfirmedByPlace(place);
      if (
        confirmedRentals.some((rental) =>
          rental.overlaps(rentalRequest.right.period),
        )
      )
        return Either.left(new DatesAlreadyRentedError());

      try {
        await this.rentalRepository.createRequest(rentalRequest.right);
      } catch (error: unknown) {
        if (!(error instanceof DuplicateIdempotencyKeyError)) throw error;
        const concurrent = await this.rentalRepository.findByIdempotencyKey(
          props.renterId,
          props.idempotencyKey,
        );
        if (!concurrent) throw error;
        return RequestRental.replay(concurrent, props);
      }

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
          page.checkoutUrl,
        );
        return Either.right({
          rentalRequest: rentalRequest.right,
          checkoutUrl: page.checkoutUrl,
          replayed: false,
        });
      } catch (error: unknown) {
        if (!(error instanceof PaymentUnavailableError)) throw error;
        // Une page que Stripe n'a pas pu ouvrir ne consomme pas l'intention :
        // le conducteur qui réessaie doit obtenir une vraie page, pas le
        // rejeu d'une demande abandonnée.
        await this.rentalRepository.markAbandoned(id);
        await this.rentalRepository.forgetIdempotencyKey(id);
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

  private static replay(
    previous: IdempotentRentalRequest,
    props: Props,
  ): Either.Either<
    RequestedRental,
    IdempotencyKeyReusedError | RentalRequestBeingCreatedError
  > {
    const state = previous.rentalRequest.toState();
    const samePlace =
      placeKeyOf({ address: state.address, box: state.box }) ===
      placeKeyOf({ address: props.address, box: props.box });
    const sameDays =
      state.days.from === props.fromDay && state.days.to === props.toDay;
    if (!samePlace || !sameDays)
      return Either.left(new IdempotencyKeyReusedError());
    if (previous.checkoutUrl === null)
      return Either.left(new RentalRequestBeingCreatedError());
    return Either.right({
      rentalRequest: previous.rentalRequest,
      checkoutUrl: previous.checkoutUrl,
      replayed: true,
    });
  }
}
