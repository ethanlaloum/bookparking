import { consentSettingsOpened } from '../../app/consent/store/consentSettings';
import {
  ExternalLink,
  LegalList,
  LegalPage,
  LegalSection,
  ToComplete,
} from '../../components/legal/LegalPage';
import { useAppDispatch } from '../../store/redux';

interface Processing {
  data: string;
  purpose: string;
  basis: string;
  retention: string;
}

// Chaque ligne décrit ce que le code fait réellement (SPEC-001 à SPEC-005).
// Une durée ou une donnée qui change dans le code change ici, dans la même
// pull request : une politique qui ment est une infraction, pas une coquille.
const PROCESSINGS: Processing[] = [
  {
    data: 'Adresse e-mail, mot de passe (jamais conservé en clair : seule son empreinte scrypt l’est), date d’inscription, pilote choisi comme avatar',
    purpose: 'Créer et sécuriser votre compte',
    basis: 'Exécution du contrat (conditions d’utilisation)',
    retention: 'Tant que le compte existe',
  },
  {
    data: 'Jeton de connexion, gardé dans votre navigateur',
    purpose: 'Vous garder connecté',
    basis: 'Exécution du contrat',
    retention: '7 jours après sa dernière utilisation',
  },
  {
    data: 'Annonces : adresse exacte et box (publics), consignes d’accès (jamais publiques), références des photos, tarifs, disponibilités, véhicules acceptés',
    purpose: 'Publier votre place et la faire trouver',
    basis: 'Exécution du contrat',
    retention: '12 mois après la dépublication, puis anonymisation',
  },
  {
    data: 'Demandes et réservations : place, période, prix, statut, dates de demande, de confirmation et d’annulation',
    purpose: 'Mettre en relation conducteurs et loueurs, gérer les réservations',
    basis: 'Exécution du contrat',
    retention: '12 mois après la fin de la période demandée',
  },
  {
    data: 'Paiement : identifiants Stripe de la page de paiement, du paiement et du remboursement, montant. Aucune donnée de carte : elle est saisie sur la page de Stripe et ne transite jamais par bookparking',
    purpose: 'Poser l’empreinte, prélever, rendre l’argent',
    basis: 'Exécution du contrat ; obligation légale de conservation comptable',
    retention: '10 ans pour les pièces comptables (article L.123-22 du Code de commerce)',
  },
  {
    data: 'Adresse IP des tentatives de connexion échouées',
    purpose: 'Ralentir les essais répétés de mot de passe',
    basis: 'Intérêt légitime : la sécurité des comptes',
    retention: 'En mémoire seulement, jamais écrite ; effacée au redémarrage du service',
  },
  {
    data: 'Actions de modération : compte de l’administrateur, action, annonce ou compte visé, motif, date',
    purpose: 'Tracer et justifier les décisions de modération',
    basis: 'Intérêt légitime ; obligation légale (règlement européen sur les services numériques)',
    retention: 'À compléter',
  },
  {
    data: 'Votre choix sur la carte et les polices, gardé dans votre navigateur',
    purpose: 'Respecter votre consentement',
    basis: 'Obligation légale',
    retention: '180 jours, puis la question vous est reposée',
  },
];

export const PrivacyPage = () => {
  const dispatch = useAppDispatch();

  return (
    <LegalPage title="Données personnelles" updatedOn="23 septembre 2026" draft>
      <LegalSection title="Qui traite vos données">
        <p>
          Le responsable du traitement est <ToComplete>nom ou raison sociale, adresse</ToComplete>.
          Pour toute question sur vos données, et pour exercer vos droits, écrivez à{' '}
          <ToComplete>adresse e-mail dédiée aux données personnelles</ToComplete>.
        </p>
      </LegalSection>

      <LegalSection title="Ce que nous gardons, pourquoi, et combien de temps">
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-fg">
                <th className="py-2 pr-3 font-semibold">Données</th>
                <th className="py-2 pr-3 font-semibold">Pour quoi faire</th>
                <th className="py-2 pr-3 font-semibold">Base légale</th>
                <th className="py-2 font-semibold">Durée</th>
              </tr>
            </thead>
            <tbody>
              {PROCESSINGS.map((processing) => (
                <tr key={processing.data} className="border-b border-line align-top">
                  <td className="py-2.5 pr-3">{processing.data}</td>
                  <td className="py-2.5 pr-3">{processing.purpose}</td>
                  <td className="py-2.5 pr-3">{processing.basis}</td>
                  <td className="py-2.5">
                    {processing.retention === 'À compléter' ? (
                      <ToComplete>durée de conservation</ToComplete>
                    ) : (
                      processing.retention
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          bookparking ne vend aucune donnée, n’affiche aucune publicité et ne mesure pas votre
          audience.
        </p>
      </LegalSection>

      <LegalSection title="Qui les reçoit">
        <LegalList>
          <li>
            <strong className="text-fg">Les autres utilisateurs</strong> voient l’adresse exacte et le
            box de vos annonces, dès leur publication. Vos consignes d’accès ne sont jamais publiées.
          </li>
          <li>
            <strong className="text-fg">Stripe</strong> (Stripe Payments Europe, Ltd., Irlande)
            traite le paiement. Les transferts de données vers les États-Unis sont encadrés par le
            Data Privacy Framework et des clauses contractuelles types.
          </li>
          <li>
            <strong className="text-fg">L’hébergeur</strong> : <ToComplete>nom de l’hébergeur</ToComplete>.
          </li>
          <li>
            <strong className="text-fg">OpenStreetMap</strong> reçoit votre adresse IP quand la carte
            s’affiche, et <strong className="text-fg">Google</strong> quand les polices se chargent —
            seulement si vous l’avez accepté.
          </li>
          <li>
            <strong className="text-fg">La Base Adresse Nationale</strong>, service public de l’État,
            reçoit l’adresse que vous tapez, et votre adresse IP, quand vous cherchez une adresse.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          bookparking ne dépose aucun cookie. Votre session et votre choix de consentement sont
          gardés dans votre navigateur, parce que le site ne fonctionne pas sans eux. La carte et
          les polices, qui appellent des services tiers, attendent votre accord.
        </p>
        <p>
          <button
            type="button"
            onClick={() => dispatch(consentSettingsOpened())}
            className="cursor-pointer font-medium text-accent underline underline-offset-4"
          >
            Revoir mon choix
          </button>
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez accéder à vos données, les faire rectifier ou effacer, en limiter le
          traitement, vous y opposer, en demander la portabilité, et donner des directives sur leur
          sort après votre décès. Écrivez à <ToComplete>adresse e-mail dédiée aux données personnelles</ToComplete> :
          une réponse vous est faite dans un délai d’un mois.
        </p>
        <p>
          La suppression de votre compte se demande de la même façon ; elle n’est pas encore
          proposée depuis le site.
        </p>
        <p>
          Vous pouvez aussi adresser une réclamation à la CNIL :{' '}
          <ExternalLink href="https://www.cnil.fr">www.cnil.fr</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les mots de passe ne sont jamais conservés en clair, et les tentatives de connexion
          répétées sont ralenties. Les données de carte ne passent jamais par bookparking.
        </p>
      </LegalSection>
    </LegalPage>
  );
};
