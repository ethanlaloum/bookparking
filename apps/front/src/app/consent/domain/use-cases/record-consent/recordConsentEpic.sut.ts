import {
  selectAreConsentSettingsOpen,
  selectConsent,
  selectIsConsentAwaited,
  selectIsPurposeAllowed,
} from '../../../../../selectors/consent/consentSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import { consentSettingsClosed, consentSettingsOpened } from '../../../store/consentSettings';
import {
  acceptEverything,
  grant,
  refuseEverything,
  type ConsentChoices,
  type ConsentPurpose,
} from '../../entities/Consent';
import { recordConsentRequested } from './recordConsentEpic';

export const createRecordConsentSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  const record = (choices: ConsentChoices): void => {
    store.dispatch(recordConsentRequested({ choices }));
  };

  return {
    givenTheClockReads(iso: string): void {
      dependencies.clock.current = new Date(iso);
    },
    whenAcceptingEverything(): void {
      record(acceptEverything());
    },
    whenRefusingEverything(): void {
      record(refuseEverything());
    },
    whenSaving(choices: ConsentChoices): void {
      record(choices);
    },
    // Ce que fait l'encart de la carte : accorder sa finalité, sans rien
    // changer aux autres réponses.
    whenGranting(purpose: ConsentPurpose): void {
      record(grant(selectConsent(store.getState()), purpose));
    },
    whenOpeningTheSettings(): void {
      store.dispatch(consentSettingsOpened());
    },
    whenClosingTheSettings(): void {
      store.dispatch(consentSettingsClosed());
    },
    thenAllowed(purpose: ConsentPurpose, expected: boolean): void {
      const actual = selectIsPurposeAllowed(store.getState(), purpose);
      if (actual !== expected)
        throw new Error(`« ${purpose} » autorisé : attendu ${String(expected)}, obtenu ${String(actual)}`);
    },
    thenTheQuestionIsAsked(expected: boolean): void {
      const actual = selectIsConsentAwaited(store.getState());
      if (actual !== expected)
        throw new Error(`Question posée : attendu ${String(expected)}, obtenu ${String(actual)}`);
    },
    thenTheSettingsAreOpen(expected: boolean): void {
      const actual = selectAreConsentSettingsOpen(store.getState());
      if (actual !== expected)
        throw new Error(`Réglages ouverts : attendu ${String(expected)}, obtenu ${String(actual)}`);
    },
    thenTheStoredDecisionIs(choices: ConsentChoices, decidedAt: string): void {
      const saved = dependencies.consentStore.saved;
      if (saved === null) throw new Error('Aucune décision n a été écrite dans le navigateur');
      const actual = JSON.stringify({ choices: saved.choices, decidedAt: saved.decidedAt });
      const expected = JSON.stringify({ choices, decidedAt });
      if (actual !== expected) throw new Error(`Décision attendue ${expected}, obtenue ${actual}`);
    },
    thenNothingIsStored(): void {
      if (dependencies.consentStore.saved !== null)
        throw new Error('Une décision a été écrite alors que rien n a été décidé');
    },
  };
};
