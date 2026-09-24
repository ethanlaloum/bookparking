import { Link } from 'react-router-dom';

import {
  ExternalLink,
  LegalList,
  LegalPage,
  LegalSection,
  ToComplete,
} from '../../components/legal/LegalPage';

const LINK = 'font-medium text-accent underline underline-offset-4';

export const LegalNoticePage = () => (
  <LegalPage title="Mentions légales" updatedOn="23 septembre 2026" draft>
    <LegalSection title="Éditeur du site">
      <p>Le site bookparking est édité par :</p>
      <LegalList>
        <li>
          <ToComplete>nom ou raison sociale, forme juridique et capital social</ToComplete>
        </li>
        <li>
          Siège : <ToComplete>adresse postale</ToComplete>
        </li>
        <li>
          Immatriculation : <ToComplete>numéro SIREN et RCS</ToComplete> — TVA intracommunautaire :{' '}
          <ToComplete>numéro de TVA</ToComplete>
        </li>
        <li>
          Contact : <ToComplete>adresse e-mail</ToComplete> — <ToComplete>téléphone</ToComplete>
        </li>
      </LegalList>
    </LegalSection>

    <LegalSection title="Directeur de la publication">
      <p>
        <ToComplete>nom et prénom du directeur de la publication</ToComplete>
      </p>
    </LegalSection>

    <LegalSection title="Hébergement">
      <p>
        Le site est hébergé par <ToComplete>nom de l’hébergeur</ToComplete>,{' '}
        <ToComplete>adresse et téléphone de l’hébergeur</ToComplete>.
      </p>
    </LegalSection>

    <LegalSection title="Point de contact">
      <p>
        Pour toute question, et pour les autorités, le point de contact unique de bookparking est{' '}
        <ToComplete>adresse e-mail du point de contact</ToComplete>. Il répond en français. Pour
        signaler une annonce illicite, voir les{' '}
        <Link to="/conditions-d-utilisation" className={LINK}>
          conditions d’utilisation
        </Link>
        .
      </p>
    </LegalSection>

    <LegalSection title="Propriété intellectuelle">
      <p>
        Les textes, illustrations et le logo de bookparking lui appartiennent. Une annonce appartient
        à son auteur, qui autorise bookparking à l’afficher tant qu’elle est publiée.
      </p>
      <LegalList>
        <li>
          Fond de carte : © contributeurs{' '}
          <ExternalLink href="https://www.openstreetmap.org/copyright">OpenStreetMap</ExternalLink>,
          sous licence ODbL.
        </li>
        <li>
          Adresses : Base Adresse Nationale, sous Licence Ouverte (Etalab).
        </li>
        <li>Polices Bricolage Grotesque, Geist et Geist Mono : SIL Open Font License.</li>
      </LegalList>
    </LegalSection>

    <LegalSection title="Données personnelles et cookies">
      <p>
        Voir la page{' '}
        <Link to="/donnees-personnelles" className={LINK}>
          Données personnelles
        </Link>{' '}
        et le lien « Gérer les cookies » en bas de chaque page.
      </p>
    </LegalSection>
  </LegalPage>
);
