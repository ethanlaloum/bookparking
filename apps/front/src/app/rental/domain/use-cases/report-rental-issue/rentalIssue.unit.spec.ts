import { describe, it } from 'vitest';

import { createRentalIssueSut } from './rentalIssue.sut';

const LEA_BOOKING = 'request-lea';
const REPORT = { reason: 'PLACE_OCCUPIED' as const, message: 'Une Clio grise est garée' };

describe('reporting a problem on a booking', () => {
  it('sends the report, then rereads « Mes réservations » once', () => {
    const sut = createRentalIssueSut();

    sut.whenReporting(LEA_BOOKING, REPORT);

    sut.thenTheApiReceived({ reported: [{ requestId: LEA_BOOKING, report: REPORT }] });
    sut.thenTheReportedRequestIs(LEA_BOOKING);
    sut.thenTheListsWereReread({ mine: 1, received: 0 });
  });

  it('shows the api refusal and rereads nothing', () => {
    const sut = createRentalIssueSut();
    sut.givenTheApiRejectsWith('Vous pourrez signaler un problème à partir du début de la location');

    sut.whenReporting(LEA_BOOKING, REPORT);

    sut.thenTheReportErrorIs('Vous pourrez signaler un problème à partir du début de la location');
    sut.thenTheReportedRequestIs(null);
    sut.thenTheListsWereReread({ mine: 0, received: 0 });
  });

  it('forgets the refusal when the dialog opens again', () => {
    const sut = createRentalIssueSut();
    sut.givenTheApiRejectsWith('Le serveur est injoignable.');
    sut.whenReporting(LEA_BOOKING, REPORT);

    sut.whenTheDialogReopens();

    sut.thenTheReportErrorIs(null);
  });
});

describe('answering a report, as the owner', () => {
  it('sends the answer, then rereads « Demandes reçues » once', () => {
    const sut = createRentalIssueSut();

    sut.whenAnswering(LEA_BOOKING, 'Le code du portail est 4821B.');

    sut.thenTheApiReceived({
      answered: [{ requestId: LEA_BOOKING, reply: 'Le code du portail est 4821B.' }],
    });
    sut.thenTheListsWereReread({ mine: 0, received: 1 });
  });

  it('shows the refusal under the booking it concerns, and only there', () => {
    const sut = createRentalIssueSut();
    sut.givenTheApiRejectsWith('Aucune réclamation ouverte n’attend votre réponse sur cette réservation');

    sut.whenAnswering(LEA_BOOKING, 'Le code du portail est 4821B.');

    sut.thenTheAnswerStateOf(LEA_BOOKING, {
      pending: false,
      error: 'Aucune réclamation ouverte n’attend votre réponse sur cette réservation',
    });
    sut.thenTheAnswerStateOf('request-karim', { pending: false, error: null });
  });
});
