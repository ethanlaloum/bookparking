import { randomUUID } from 'node:crypto';

import { Either } from 'effect/index';

import { InvalidIssueMessageError } from '../errors/InvalidIssueMessageError';
import { MoneyState, RentalRequestStatus } from './RentalMoney';

export type RentalIssueReason = 'NO_ACCESS' | 'PLACE_OCCUPIED' | 'OTHER';

// OPEN : l'argent du loueur est gelé, Bookparking n'a pas encore tranché.
// Les trois autres sont des décisions, et aucune ne revient à OPEN.
export type RentalIssueStatus =
  'OPEN' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'DISMISSED';

export const MINIMUM_ISSUE_TEXT_LENGTH = 10;
export const MAXIMUM_ISSUE_TEXT_LENGTH = 2000;

export interface RentalIssueState {
  id: string;
  requestId: string;
  reason: RentalIssueReason;
  message: string | null;
  reportedAt: Date;
  status: RentalIssueStatus;
  ownerReply: string | null;
  ownerRepliedAt: Date | null;
  refundInCents: number | null;
  resolvedAt: Date | null;
}

// Ce qu'une réservation doit être pour qu'on puisse s'en plaindre.
export interface IssueFacts {
  status: RentalRequestStatus;
  money: MoneyState;
  startsAt: Date;
  endsAt: Date;
  arrivedAt: Date | null;
  transferred: boolean;
  hasIssue: boolean;
}

export type ReportRefusal =
  | 'ALREADY_REPORTED'
  | 'NOT_CONFIRMED'
  | 'NOT_STARTED'
  | 'ENDED'
  | 'ARRIVED'
  | 'PAID_OUT';

/**
 * Une réclamation porte sur une réservation payée, pendant qu'elle a lieu —
 * on ne sait qu'on ne peut pas entrer qu'une fois devant la porte. Elle n'a
 * plus lieu d'être une fois l'arrivée confirmée (le conducteur a dit qu'il
 * était entré), ni une fois l'argent parti vers le loueur : le geler n'est
 * alors plus possible, et le rendre coûterait à Bookparking.
 */
export const reportRefusalOf = (
  facts: IssueFacts,
  now: Date,
): ReportRefusal | null => {
  if (facts.hasIssue) return 'ALREADY_REPORTED';
  if (facts.status !== 'CONFIRMED' || facts.money !== 'CAPTURED')
    return 'NOT_CONFIRMED';
  if (now.getTime() < facts.startsAt.getTime()) return 'NOT_STARTED';
  if (now.getTime() > facts.endsAt.getTime()) return 'ENDED';
  if (facts.arrivedAt !== null) return 'ARRIVED';
  if (facts.transferred) return 'PAID_OUT';
  return null;
};

const trimmedOrNull = (text: string | null | undefined): string | null => {
  const trimmed = (text ?? '').trim();
  return trimmed === '' ? null : trimmed;
};

// Le motif suffit à « je ne peux pas entrer » et « la place est occupée » :
// le conducteur est dans la rue, on ne lui fait pas écrire une lettre. « Autre »
// n'a de sens qu'avec quelques mots.
export const reportIssue = (params: {
  requestId: string;
  reason: RentalIssueReason;
  message?: string | null;
  reportedAt: Date;
}): Either.Either<RentalIssueState, InvalidIssueMessageError> => {
  const message = trimmedOrNull(params.message);
  if (message !== null && message.length > MAXIMUM_ISSUE_TEXT_LENGTH)
    return Either.left(new InvalidIssueMessageError('tooLong'));
  if (
    params.reason === 'OTHER' &&
    (message === null || message.length < MINIMUM_ISSUE_TEXT_LENGTH)
  )
    return Either.left(new InvalidIssueMessageError('required'));

  return Either.right({
    id: randomUUID(),
    requestId: params.requestId,
    reason: params.reason,
    message,
    reportedAt: params.reportedAt,
    status: 'OPEN',
    ownerReply: null,
    ownerRepliedAt: null,
    refundInCents: null,
    resolvedAt: null,
  });
};

export const checkOwnerReply = (
  reply: string,
): Either.Either<string, InvalidIssueMessageError> => {
  const trimmed = reply.trim();
  if (trimmed.length < MINIMUM_ISSUE_TEXT_LENGTH)
    return Either.left(new InvalidIssueMessageError('required'));
  if (trimmed.length > MAXIMUM_ISSUE_TEXT_LENGTH)
    return Either.left(new InvalidIssueMessageError('tooLong'));
  return Either.right(trimmed);
};

export const isAnswerable = (issue: RentalIssueState | null): boolean =>
  issue !== null && issue.status === 'OPEN' && issue.ownerReply === null;
