import { GenericTransaction } from '../../../unit-of-work/GenericTransaction';
import { PlatformSettings } from '../entities/PlatformSettings';

// Lu à chaque exécution, jamais au démarrage : un réglage changé depuis le
// back-office vaut dès la demande suivante, sans redéployer l'api.
export interface PlatformSettingsReader {
  current(trx?: GenericTransaction): Promise<PlatformSettings>;
}
