import { describe, it } from 'vitest';

import { createRecordConsentSut } from './recordConsentEpic.sut';

const NOW = '2026-09-23T08:30:00.000Z';

describe('recording what a visitor allows', () => {
  it('asks before anything is decided, and allows nothing meanwhile', () => {
    const sut = createRecordConsentSut();
    sut.thenTheQuestionIsAsked(true);
    sut.thenAllowed('map', false);
    sut.thenAllowed('fonts', false);
    sut.thenNothingIsStored();
  });

  it('allows both purposes and remembers the decision, dated, when accepting everything', () => {
    const sut = createRecordConsentSut();
    sut.givenTheClockReads(NOW);
    sut.whenAcceptingEverything();
    sut.thenAllowed('map', true);
    sut.thenAllowed('fonts', true);
    sut.thenTheQuestionIsAsked(false);
    sut.thenTheStoredDecisionIs({ map: true, fonts: true }, NOW);
  });

  it('records a refusal too, so that the question is not asked again on every page', () => {
    const sut = createRecordConsentSut();
    sut.givenTheClockReads(NOW);
    sut.whenRefusingEverything();
    sut.thenAllowed('map', false);
    sut.thenAllowed('fonts', false);
    sut.thenTheQuestionIsAsked(false);
    sut.thenTheStoredDecisionIs({ map: false, fonts: false }, NOW);
  });

  it('keeps each answer of a custom choice', () => {
    const sut = createRecordConsentSut();
    sut.givenTheClockReads(NOW);
    sut.whenSaving({ map: false, fonts: true });
    sut.thenAllowed('map', false);
    sut.thenAllowed('fonts', true);
    sut.thenTheStoredDecisionIs({ map: false, fonts: true }, NOW);
  });

  it('withdraws as simply as it grants', () => {
    const sut = createRecordConsentSut();
    sut.whenAcceptingEverything();
    sut.givenTheClockReads(NOW);
    sut.whenSaving({ map: false, fonts: false });
    sut.thenAllowed('map', false);
    sut.thenAllowed('fonts', false);
    sut.thenTheStoredDecisionIs({ map: false, fonts: false }, NOW);
  });

  it('grants the map alone to an undecided visitor who asks to see it', () => {
    const sut = createRecordConsentSut();
    sut.whenGranting('map');
    sut.thenAllowed('map', true);
    sut.thenAllowed('fonts', false);
  });

  it('leaves the fonts as they were when the map is granted from its placeholder', () => {
    const sut = createRecordConsentSut();
    sut.whenSaving({ map: false, fonts: true });
    sut.whenGranting('map');
    sut.thenAllowed('map', true);
    sut.thenAllowed('fonts', true);
  });

  it('closes the settings once the choice is saved', () => {
    const sut = createRecordConsentSut();
    sut.whenOpeningTheSettings();
    sut.thenTheSettingsAreOpen(true);
    sut.whenSaving({ map: true, fonts: false });
    sut.thenTheSettingsAreOpen(false);
  });

  it('decides nothing by merely opening and closing the settings', () => {
    const sut = createRecordConsentSut();
    sut.whenOpeningTheSettings();
    sut.whenClosingTheSettings();
    sut.thenTheSettingsAreOpen(false);
    sut.thenTheQuestionIsAsked(true);
    sut.thenNothingIsStored();
  });
});
