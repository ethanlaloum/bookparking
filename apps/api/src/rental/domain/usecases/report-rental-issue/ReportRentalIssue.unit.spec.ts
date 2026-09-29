import { Either } from 'effect/index';

import {
  createRentalIssueSUT,
  LEA,
  MARC,
  REQUEST,
} from './ReportRentalIssue.sut';

const OPEN_ISSUE = {
  requestId: REQUEST,
  reason: 'NO_ACCESS' as const,
  message: null,
  reportedAt: new Date('2026-10-10T08:00:00.000Z'),
  status: 'OPEN' as const,
  ownerReply: null,
  ownerRepliedAt: null,
  refundInCents: null,
  resolvedAt: null,
};

describe('ReportRentalIssue', () => {
  it('records the problem the driver meets on the spot and tells the owner', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();

    const result = await sut.whenReporting({
      reason: 'PLACE_OCCUPIED',
      message: '  Une Clio grise est garée sur la place  ',
    });

    expect(result).toEqual(Either.right(undefined));
    sut.thenIssuesAre([
      {
        ...OPEN_ISSUE,
        reason: 'PLACE_OCCUPIED',
        message: 'Une Clio grise est garée sur la place',
      },
    ]);
    sut.thenNotificationsAre([
      { kind: 'RENTAL_ISSUE_REPORTED', recipientId: MARC, requestId: REQUEST },
    ]);
  });

  it('accepts « no access » without a word: the driver is in the street', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();

    await sut.whenReporting({ reason: 'NO_ACCESS', message: '   ' });

    sut.thenIssuesAre([OPEN_ISSUE]);
  });

  it('asks a few words for « other »', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();

    const result = await sut.whenReporting({ reason: 'OTHER', message: 'Bof' });

    sut.thenRefusedWith(result, {
      name: 'InvalidIssueMessageError',
      message: 'Décrivez le problème en quelques mots, 10 caractères au moins',
    });
    sut.thenIssuesAre([]);
  });

  it('refuses a message longer than 2 000 characters', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();

    const result = await sut.whenReporting({ message: 'x'.repeat(2001) });

    sut.thenRefusedWith(result, {
      name: 'InvalidIssueMessageError',
      message: 'Le message ne peut pas dépasser 2 000 caractères',
    });
  });

  it('hides the rental from any account but its driver', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();

    const result = await sut.whenReporting({ by: MARC });

    sut.thenRefusedWith(result, {
      name: 'RentalRequestNotFoundError',
      message: "Cette demande de location n'existe pas",
    });
    sut.thenNotificationsAre([]);
  });

  it.each([
    [
      'one millisecond before the rental starts',
      {},
      '2026-10-09T21:59:59.999Z',
      'Vous pourrez signaler un problème à partir du début de la location',
    ],
    [
      'one millisecond after it ends',
      {},
      '2026-10-12T22:00:00.000Z',
      'La location est terminée : il n’est plus possible de signaler un problème',
    ],
    [
      'once the driver confirmed the arrival',
      { arrivedAt: new Date('2026-10-10T07:00:00.000Z') },
      '2026-10-10T08:00:00.000Z',
      'Vous avez confirmé votre arrivée : il n’est plus possible de signaler un problème',
    ],
    [
      'once the money went to the owner',
      { transferred: true },
      '2026-10-10T08:00:00.000Z',
      'L’argent de cette location a déjà été versé au loueur : il n’est plus possible de signaler un problème',
    ],
    [
      'on a request the owner never confirmed',
      { status: 'PENDING' as const, money: 'AUTHORIZED' as const },
      '2026-10-10T08:00:00.000Z',
      'Seule une réservation confirmée et payée peut faire l’objet d’une réclamation',
    ],
  ])('refuses a report %s', async (_case, overrides, at, message) => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental(overrides);

    const result = await sut.whenReporting({ at });

    sut.thenRefusedWith(result, {
      name: 'RentalIssueNotReportableError',
      message,
    });
    sut.thenIssuesAre([]);
  });

  it('accepts a report on the first and on the last instant of the rental', async () => {
    const first = createRentalIssueSUT();
    first.givenConfirmedRental();
    const last = createRentalIssueSUT();
    last.givenConfirmedRental();

    const onTheFirst = await first.whenReporting({
      at: '2026-10-09T22:00:00.000Z',
    });
    const onTheLast = await last.whenReporting({
      at: '2026-10-12T21:59:59.999Z',
    });

    expect([onTheFirst, onTheLast]).toEqual([
      Either.right(undefined),
      Either.right(undefined),
    ]);
  });

  it('keeps a single report per rental, and tells the owner once', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();
    await sut.givenReported();

    const second = await sut.whenReporting({ reason: 'PLACE_OCCUPIED' });

    sut.thenRefusedWith(second, {
      name: 'RentalIssueNotReportableError',
      message:
        'Un problème a déjà été signalé sur cette réservation : Bookparking l’examine',
    });
    sut.thenIssuesAre([OPEN_ISSUE]);
    sut.thenNotificationsAre([
      { kind: 'RENTAL_ISSUE_REPORTED', recipientId: MARC, requestId: REQUEST },
    ]);
  });
});

describe('AnswerRentalIssue', () => {
  it('records the answer of the owner once and tells the driver', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();
    await sut.givenReported();

    const first = await sut.whenAnswering({
      reply: '  Le code du portail a changé : 4821B.  ',
    });
    const second = await sut.whenAnswering({
      reply: 'Une seconde réponse, trop tard',
    });

    expect(first).toEqual(Either.right(undefined));
    sut.thenRefusedWith(second, {
      name: 'RentalIssueNotAnswerableError',
      message:
        'Aucune réclamation ouverte n’attend votre réponse sur cette réservation',
    });
    sut.thenIssuesAre([
      {
        ...OPEN_ISSUE,
        ownerReply: 'Le code du portail a changé : 4821B.',
        ownerRepliedAt: new Date('2026-10-10T08:30:00.000Z'),
      },
    ]);
    sut.thenNotificationsAre([
      { kind: 'RENTAL_ISSUE_REPORTED', recipientId: MARC, requestId: REQUEST },
      { kind: 'RENTAL_ISSUE_ANSWERED', recipientId: LEA, requestId: REQUEST },
    ]);
  });

  it('hides the rental from the driver, who cannot answer herself', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();
    await sut.givenReported();

    const result = await sut.whenAnswering({
      by: LEA,
      reply: 'Je réponds à ma place',
    });

    sut.thenRefusedWith(result, {
      name: 'RentalRequestNotFoundError',
      message: "Cette demande de location n'existe pas",
    });
  });

  it('has nothing to answer on a rental without a report', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();

    const result = await sut.whenAnswering({
      reply: 'Il n’y a pourtant rien à dire',
    });

    sut.thenRefusedWith(result, {
      name: 'RentalIssueNotAnswerableError',
      message:
        'Aucune réclamation ouverte n’attend votre réponse sur cette réservation',
    });
  });

  it('asks the owner a few words', async () => {
    const sut = createRentalIssueSUT();
    sut.givenConfirmedRental();
    await sut.givenReported();

    const result = await sut.whenAnswering({ reply: 'Faux' });

    sut.thenRefusedWith(result, {
      name: 'InvalidIssueMessageError',
      message: 'Décrivez le problème en quelques mots, 10 caractères au moins',
    });
  });
});
