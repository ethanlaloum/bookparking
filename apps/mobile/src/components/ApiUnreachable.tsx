import { useTranslation } from 'react-i18next';

import { resolveApiBaseUrl } from '../lib/apiBaseUrl';
import { Notice } from './ui/Notice';

const UNREACHABLE = 'Le serveur est injoignable. Vérifiez votre connexion.';

/**
 * L'erreur d'une lecture, dite comme le site la dit. Quand c'est le réseau qui
 * manque — le message de `FetchHttpClient` pour un statut 0 —, l'app ajoute où
 * elle a cherché l'api : sur un téléphone, c'est presque toujours l'adresse du
 * Mac ou le Wi-Fi, et le dire fait gagner le quart d'heure de recherche.
 */
export const ApiUnreachable = ({ message }: { message: string }) => {
  const { t } = useTranslation(['common', 'mobile']);
  if (message !== UNREACHABLE)
    return (
      <Notice tone="error" title={t('common:error.title')}>
        {message}
      </Notice>
    );
  return (
    <Notice tone="error" title={t('mobile:offline.title')}>
      {t('mobile:offline.body', { url: resolveApiBaseUrl() })}
    </Notice>
  );
};
