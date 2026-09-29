import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  ExternalLink,
  LegalList,
  LegalPage,
  LegalSection,
  ToComplete,
} from '../../components/legal/LegalPage';
import { Loader } from '../../components/Loader';
import { Notice } from '../../components/Notice';
import { Button } from '../../components/ui/button';
import { useRentalTerms } from '../../hooks/useRentalTerms';

const LINK = 'font-medium text-accent underline underline-offset-4';

// Les délais cités ici sont ceux du code. Les 30 minutes de la page de paiement
// sont une constante de l'api (SPEC-004) : si elle change, cette page change
// dans la même pull request. Le délai du loueur, l'annulation gratuite, la
// commission et le reversement se règlent depuis le back-office et viennent de
// `GET /rental-terms` : la page ne s'affiche qu'une fois qu'elle les connaît.
export const TermsPage = () => {
  const { t } = useTranslation('common');
  const { texts, error, retry } = useRentalTerms();

  if (texts === null)
    return error === null ? (
      <Loader />
    ) : (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Notice tone="error" title={t('error.title')}>
          {error}
          <Button size="sm" variant="outline" onClick={retry} className="mt-3">
            {t('action.retry')}
          </Button>
        </Notice>
      </div>
    );

  return (
    <LegalPage title="Conditions d’utilisation" updatedOn="23 septembre 2026" draft>
      <LegalSection title="1. Ce que fait bookparking">
        <p>
          bookparking met en relation des particuliers qui louent leur place de stationnement (les{' '}
          <strong className="text-fg">loueurs</strong>) et des conducteurs qui cherchent où se garer
          (les <strong className="text-fg">conducteurs</strong>). La location est conclue entre le
          loueur et le conducteur : bookparking n’est propriétaire d’aucune place et n’est pas partie
          à la location. Il fournit le site, encaisse le paiement et le rend au conducteur quand il
          lui revient.
        </p>
        <p>
          Créer un compte vaut acceptation des présentes conditions. Elles s’appliquent à tout
          utilisateur, qu’il loue, réserve, ou les deux.
        </p>
      </LegalSection>

      <LegalSection title="2. Votre compte">
        <LegalList>
          <li>Le service est réservé aux personnes majeures agissant à titre privé.</li>
          <li>
            Un compte se crée avec une adresse e-mail et un mot de passe. Vous gardez votre mot de
            passe pour vous, et répondez de ce qui est fait depuis votre compte.
          </li>
          <li>
            Vous pouvez demander la fermeture de votre compte à tout moment, comme l’explique la page{' '}
            <Link to="/donnees-personnelles" className={LINK}>
              Données personnelles
            </Link>
            .
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Publier une place">
        <LegalList>
          <li>
            Vous ne publiez qu’une place que vous avez le droit de louer : vous en êtes propriétaire,
            ou votre bail et le règlement de votre copropriété le permettent.
          </li>
          <li>
            Vous décrivez la place telle qu’elle est : adresse, box, véhicules acceptés, disponibilités.
            L’adresse exacte et le box sont visibles de tous dès la publication. Les consignes
            d’accès ne sont jamais publiées.
          </li>
          <li>
            Vous fixez vous-même vos tarifs, à la journée, à la semaine ou au mois. Le prix d’une
            demande est calculé à partir de votre grille et figé au moment où elle est faite.
          </li>
          <li>
            Vous pouvez dépublier votre place à tout moment ; les locations déjà confirmées restent
            dues.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Comment les places sont classées">
        <p>
          Quand vous cherchez une adresse, les places sont classées de la plus proche à la plus
          éloignée. Sans adresse, les plus récemment publiées viennent en premier. Les filtres que
          vous choisissez, comme le type de véhicule, écartent les places qui n’y répondent pas.
          Aucune place n’est mise en avant contre rémunération.
        </p>
      </LegalSection>

      <LegalSection title="5. Réserver et payer">
        <LegalList>
          <li>
            Vous demandez une place pour une période. Le prix affiché avant l’envoi est celui qui
            sera prélevé.
          </li>
          <li>
            Le paiement se fait par carte sur une page de Stripe, notre prestataire de paiement.
            bookparking ne voit jamais votre carte. La page de paiement expire au bout de 30 minutes.
          </li>
          <li>
            Votre carte reçoit une <strong className="text-fg">empreinte</strong> : la somme est
            réservée sur votre compte, pas prélevée. Le loueur reçoit alors votre demande.
          </li>
          <li>
            Si le loueur confirme dans les {texts.expiry}, la somme est prélevée et la location est
            conclue. Sans confirmation dans ce délai, la demande expire et l’empreinte est levée :
            rien n’est prélevé.
          </li>
          <li>
            bookparking garde une commission de {texts.fee} % du prix payé par le conducteur, et
            reverse le reste au loueur dès que le conducteur confirme son arrivée, ou au plus tard{' '}
            {texts.release} après le début de la location.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="6. Annuler">
        <LegalList>
          <li>
            <strong className="text-fg">Le conducteur</strong> peut annuler une demande en attente, ou
            une location confirmée qui n’a pas commencé. Jusqu’à {texts.freeCancellation} avant le début de la
            location, il est remboursé en totalité. Après, il peut toujours annuler, mais la somme
            prélevée n’est pas remboursée.
          </li>
          <li>
            <strong className="text-fg">Le loueur</strong> peut annuler une demande ou une location
            sur sa place tant qu’elle n’a pas commencé. Le conducteur est alors remboursé en totalité.
          </li>
          <li>
            <strong className="text-fg">bookparking</strong> peut annuler une demande ou une
            location, par exemple quand la place se révèle inaccessible, et en donne le motif : le
            conducteur récupère alors tout son argent.
          </li>
          <li>
            Le délai d’annulation gratuite est celui en vigueur au moment de la demande, et reste
            celui-là même s’il change ensuite. Une location commencée ne s’annule plus depuis le site :
            écrivez-nous.
          </li>
          <li>
            La location d’une place à une date déterminée, entre particuliers, n’ouvre pas de droit
            de rétractation : ce sont les règles ci-dessus qui s’appliquent.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="7. Vos obligations fiscales et sociales">
        <p>
          Les sommes que vous percevez en louant votre place sont des revenus : vous devez les
          déclarer à l’administration fiscale, et, le cas échéant, aux organismes sociaux. Vous
          trouverez les règles applicables sur{' '}
          <ExternalLink href="https://www.impots.gouv.fr">impots.gouv.fr</ExternalLink> et sur{' '}
          <ExternalLink href="https://www.urssaf.fr">urssaf.fr</ExternalLink>.
        </p>
        <p>
          bookparking est tenu de déclarer chaque année à l’administration fiscale les revenus
          perçus par ses loueurs par son intermédiaire (articles 242 bis et 1649 ter A du Code
          général des impôts). Il vous demandera pour cela les informations que la loi exige, et
          vous adressera une copie de ce qu’il déclare.
        </p>
      </LegalSection>

      <LegalSection title="8. Ce qui est interdit, et comment le signaler">
        <p>
          Il est interdit de publier une place que l’on n’a pas le droit de louer, une annonce
          trompeuse, ou un contenu illicite, et d’utiliser bookparking pour autre chose que louer ou
          réserver une place.
        </p>
        <p>
          Pour signaler une annonce ou un contenu illicite, écrivez à{' '}
          <ToComplete>adresse e-mail de signalement</ToComplete> en précisant l’annonce en cause et la
          raison du signalement. Chaque signalement est examiné, et son auteur informé de la suite
          qui lui est donnée.
        </p>
        <p>
          bookparking peut retirer une annonce ou suspendre un compte qui ne respecte pas ces
          conditions. Chaque décision est motivée, et vous pouvez la contester en écrivant à la même
          adresse.
        </p>
      </LegalSection>

      <LegalSection title="9. Responsabilités">
        <LegalList>
          <li>
            Le loueur répond de l’exactitude de son annonce et de l’accès à sa place pendant la
            location. Le conducteur répond de l’usage qu’il fait de la place et de son véhicule.
          </li>
          <li>
            bookparking répond du bon fonctionnement du site et du paiement. Il ne répond ni de
            l’état de la place, ni des dommages survenus pendant une location, qui relèvent des
            assurances du loueur et du conducteur.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="10. Modifications">
        <p>
          bookparking peut faire évoluer ces conditions. Vous en êtes informé avant leur entrée en
          vigueur ; les locations déjà confirmées restent régies par les conditions en vigueur au
          moment de la demande.
        </p>
      </LegalSection>

      <LegalSection title="11. Litiges">
        <p>
          Ces conditions sont soumises au droit français. En cas de désaccord, écrivez-nous d’abord :
          nous cherchons une solution amiable. Si elle n’aboutit pas, vous pouvez recourir
          gratuitement au médiateur de la consommation :{' '}
          <ToComplete>nom, adresse et site du médiateur</ToComplete>.
        </p>
        <p>
          Voir aussi les{' '}
          <Link to="/mentions-legales" className={LINK}>
            mentions légales
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
};
