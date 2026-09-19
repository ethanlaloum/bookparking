---
type: llm-distillat
source: BRAINSTORM.md
id: BR-20260919-comptes-authentification
---

# Distillat — BR-20260919-comptes-authentification

## Sujet
Pour un loueur et un conducteur, créer un compte, se connecter et obtenir un jeton que la
garde accepte, afin que les routes authentifiées de SPEC-001 deviennent atteignables.

## Objectif
Les routes authentifiées de SPEC-001 passent de 0 atteignable à toutes, parce qu'un loueur et
un conducteur peuvent créer un compte, se connecter et obtenir un jeton que la garde accepte.

## Acteurs
- Loueur — publie une annonce, doit disposer d'un compte que SPEC-001 suppose déjà exister mais que rien ne crée aujourd'hui.
- Conducteur — demande une place, doit désormais avoir un compte pour que sa demande soit enregistrée (D-01).
- Visiteur — consulte une annonce sans compte, non affecté par ce sujet.

## Vocabulaire
- Compte — identité unique d'une personne, identifiée par son adresse e-mail (D-08). Ne pas confondre avec « loueur » ou « conducteur », des actions du compte, pas des types de comptes.
- Jeton — preuve de connexion valable 7 jours glissants, prolongée à chaque usage (D-04). Ne pas confondre avec une session révocable côté serveur (écartée).
- Garde (AuthGuard) — refuse déjà toute requête sans jeton valide, délègue à `AccessTokenVerifier`. Ne pas confondre avec le mécanisme d'émission du jeton, à construire.
- Ralentissement — réponse progressive aux échecs de connexion, sans jamais verrouiller un compte (D-09). Ne pas confondre avec un blocage temporaire ou définitif (écarté).
- Dépublication — statut qu'une annonce prend quand elle sort d'usage (SPEC-001), réutilisé par D-07 à la suppression d'un compte.

## Règles candidates
- Une demande de location n'est enregistrée que pour un conducteur qui a un compte.
- Lire une annonce ne demande aucun compte, publier et demander en demandent un.
- Une connexion inutilisée pendant sept jours cesse d'être valable et l'utilisateur doit ressaisir son mot de passe.
- Le même compte peut publier une place et demander celle d'un autre, sans changement d'état ni de rôle.
- Supprimer un compte dépublie toutes ses annonces actives.
- Une location passée subsiste après la suppression du compte, sans donnée personnelle.
- Une série d'échecs de connexion ralentit les essais suivants sans jamais rendre un compte inaccessible.
- Un compte connecté peut changer son mot de passe sans repasser par un e-mail.

## Cas vécus
aucun

## Contraintes
- Aucune carte de code n'existe ; tout ancrage vient d'une lecture directe du dépôt.
- SPEC-001 §2 place le compte hors de son périmètre — c'est ce sujet qui le couvre.
- Ce sujet bloque le démarrage de l'api et le parcours de bout en bout ; il passe en premier.
- `auth.guard.ts` et `AccessTokenVerifier` restent inchangés dans leur contrat.
- V1 sans envoi d'e-mail du tout : ni vérification d'adresse, ni réinitialisation.
- Le RGPD impose de répondre à une demande d'effacement sous un mois.
- Dette #18 (annonces dépubliées, demandes sans suite) doit se raccorder à la suppression de compte.
- Une contrainte d'unicité en base interdit deux annonces actives sur une même place.
- Aucune limitation de débit n'existe dans le dépôt (rejoint AUTO-30 de SPEC-001).

## Questions ouvertes
- Q-01 — sans envoi d'e-mail en v1, l'adresse saisie à l'inscription n'est vérifiée par personne · tranché par JP · bloque la règle candidate sur l'unicité et la validité de l'adresse.

## Ancrages code
- `apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:15` → la garde délègue à un vérificateur de jeton sans implémentation, refuse tout aujourd'hui.
- `apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts:1` → seul contrat existant côté comptes.
- `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.ts:55` → publier lit déjà le loueur sur le compte authentifié.
- `apps/api/src/rental/domain/usecases/request-rental/RequestRental.ts:16` → demander prend un `renterId` libre, à faire venir du compte connecté.
- `docs/specs/SPEC-001-publier-une-place.md:314` et `:321` → la lecture d'une annonce ne dépend d'aucun compte.
- `docs/specs/SPEC-001-publier-une-place.md:492` → le compte du loueur est déjà supposé exister, sans que rien ne le crée.
- `apps/api/src/infra/migrations/20260917120000_create_listings.ts:6` → `owner_id` et `renter_id` ne savent pas ce que devient leur ligne quand la personne s'en va.

## Périmètre
Dedans — inscription e-mail/mot de passe, connexion et jeton, `AccessTokenVerifier` implémenté, conducteur authentifié sur `RequestRental`, suppression de compte (dépublication + anonymisation), ralentissement des essais, changement de mot de passe connecté, journalisation des échecs, longueur minimale du mot de passe (ces trois derniers à revalider).
Dehors — mot de passe oublié (D-03), vérification d'adresse (Q-01), SMS/Google/Apple (T3), rôle déclaré à l'inscription (D-05), révocation de session (D-04), déconnexion (jeton sans état).

## Décisions
- D-01 — un conducteur doit avoir un compte pour demander une place.
- D-02 — connexion par e-mail et mot de passe.
- D-03 — pas de parcours « mot de passe oublié » dans la première version.
- D-04 — jeton valable 7 jours, prolongé à chaque usage.
- D-05 — une personne, un compte ; publier et demander sont des actions, pas des types de comptes.
- D-06 — la suppression de compte fait partie de la première version.
- D-07 — à la suppression d'un compte, ses annonces sont dépubliées et ses données personnelles effacées des lignes qui subsistent.
- D-08 — l'adresse e-mail identifie le compte et ne peut pas être portée par deux comptes.
- D-09 — les essais de connexion sont ralentis progressivement, aucun compte n'est jamais verrouillé.

## Risques
- R-01 — un utilisateur enfermé dehors doit passer par une réinitialisation manuelle en base · signal : les messages de demande de réinitialisation · parade : aucune en v1, D-03 à revalider · gravité : moyenne.
- R-02 — un jeton volé reste utilisable jusqu'à sept jours, aucune révocation à distance n'est possible · signal : aucun aujourd'hui · parade : aucune en v1, à revoir quand SPEC-003 fera entrer l'argent · gravité : moyenne.
- R-03 — une location en cours se retrouve sans loueur joignable après suppression · signal : un conducteur qui signale ne plus pouvoir joindre le loueur · parade : aucune en v1 · gravité : moyenne.
- R-04 — une attaque lente et répartie passe sous le ralentissement · signal : aucun aujourd'hui · parade : partielle, le ralentissement seul · gravité : moyenne.
- R-05 — sans vérification d'adresse en v1, un loueur injoignable publie et un conducteur attend une réponse qui n'arrivera jamais · signal : demandes sans réponse du loueur · parade : aucune en v1 · gravité : moyenne.
- R-06 — l'adresse identifie le compte mais n'est vérifiée par personne et il n'existe aucun recours : quiconque saisit l'adresse d'un autre la lui confisque définitivement · signal : « mon adresse est déjà prise » au support · parade : aucune en v1, lève Q-01 ou D-03 · gravité : forte.
- R-07 — la suppression de compte et la purge de la dette #18 anonymisent les mêmes tables par deux chemins écrits séparément · signal : une ligne anonymisée d'un côté et intacte de l'autre · parade : traiter #18 dans la même spec que la suppression · gravité : moyenne.

## Cadrages rejetés et pourquoi
- Connexion par lien magique par e-mail plutôt que mot de passe — écartée malgré la recommandation (rien de secret stocké), mot de passe retenu (D-02).
- Jeton court + rafraîchi, seule option révocable — écarté au profit d'un jeton unique de 7 jours glissants, pour ne rien stocker ni rafraîchir (D-04).
- Deux comptes distincts ou rôle choisi à l'inscription — écartés au profit d'un compte unique dont le rôle découle de l'action (D-05).
- Refuser la suppression tant qu'une location court, ou tout supprimer — écartés au profit de dépublier puis anonymiser (D-07).
- Bloquer un compte 15 minutes ou définitivement après des échecs — écarté au profit d'un ralentissement progressif qui n'enferme jamais dehors (D-09).
