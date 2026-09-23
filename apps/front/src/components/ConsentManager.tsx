import {
  acceptEverything,
  refuseEverything,
  type ConsentChoices,
} from '../app/consent/domain/entities/Consent';
import { recordConsentRequested } from '../app/consent/domain/use-cases/record-consent/recordConsentEpic';
import { consentSettingsClosed, consentSettingsOpened } from '../app/consent/store/consentSettings';
import { useGoogleFonts } from '../hooks/useGoogleFonts';
import {
  selectAreConsentSettingsOpen,
  selectConsentChoices,
  selectIsConsentAwaited,
  selectIsPurposeAllowed,
} from '../selectors/consent/consentSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { ConsentBanner } from './ConsentBanner';
import { ConsentSettingsDialog } from './ConsentSettingsDialog';

/**
 * Le conteneur du consentement : le bandeau tant qu'aucune décision valable
 * n'existe, le panneau de réglages quand on l'ouvre, et les polices de Google
 * quand — et seulement quand — elles sont permises.
 */
export const ConsentManager = () => {
  const dispatch = useAppDispatch();
  const awaited = useAppSelector(selectIsConsentAwaited);
  const settingsOpen = useAppSelector(selectAreConsentSettingsOpen);
  const choices = useAppSelector(selectConsentChoices);
  const fontsAllowed = useAppSelector((state) => selectIsPurposeAllowed(state, 'fonts'));

  useGoogleFonts(fontsAllowed);

  const record = (decided: ConsentChoices) =>
    dispatch(recordConsentRequested({ choices: decided }));

  return (
    <>
      {awaited && !settingsOpen && (
        <ConsentBanner
          onAcceptAll={() => record(acceptEverything())}
          onRefuseAll={() => record(refuseEverything())}
          onCustomize={() => dispatch(consentSettingsOpened())}
        />
      )}
      <ConsentSettingsDialog
        open={settingsOpen}
        choices={choices}
        onSave={record}
        onAcceptAll={() => record(acceptEverything())}
        onRefuseAll={() => record(refuseEverything())}
        onClose={() => dispatch(consentSettingsClosed())}
      />
    </>
  );
};
