---
type: llm-distillat
source: BRAINSTORM.md
id: BR-20260910-reserver-et-louer-une-place
---

# Distillat — BR-20260910-reserver-et-louer-une-place

## Sujet
Pour un particulier propriétaire d'une place de parking à Nice, publier sa place en location, et pour un conducteur, réserver et louer une place, afin de résoudre un manque d'offre que leboncoin ne couvre pas.

## Objectif
Le nombre de places de parking publiées par des loueurs à Nice passe de 0 aujourd'hui à plusieurs centaines (D-25 ; formulation proposée par Claude, à confirmer à la porte).

## Acteurs
- Loueur — met sa place en location, fixe sa grille tarifaire, doit être payé sans risque et sans démarche complexe à l'inscription.
- Conducteur — cherche et réserve une place, veut être remboursé si elle n'est pas disponible à son arrivée.
- Exploitant (admin) — opère le back-office, encaisse la commission, règle marge et délais, tranche les réclamations.

## Vocabulaire
- Loueur — met sa place en location. Ne pas confondre avec « locataire » (évité, deux lettres d'écart, sens inverse).
- Conducteur — réserve et se gare. Ne pas confondre avec « client ».
- Client — trois sens chez JP : le conducteur, l'ensemble des utilisateurs vus du back-office, le commanditaire du projet. Jamais utilisé seul dans une règle.
- Exploitant / Admin — opère le back-office, règle marge et délais.
- Back-office — surface d'administration de l'exploitant, distincte des apps loueur/conducteur.
- Demande — intention de location non encore acceptée. Ne pas confondre avec « réservation ».
- Réservation — demande acceptée explicitement par le loueur.
- Grille tarifaire — barème de prix fixé par le loueur, par durée (jour/semaine/mois).
- Libération — événement qui déclenche le versement au loueur (confirmation d'arrivée ou expiration d'un délai).
- Réclamation — signalement avec preuve, tranché au cas par cas par l'exploitant.

## Règles candidates
- Le prix d'une réservation est calculé à partir de la grille du loueur, jamais d'un tarif fixé par la plateforme.
- Une place n'est réservée qu'après acceptation explicite du loueur ; une demande non acceptée ne vaut pas réservation.
- Le loueur peut décliner une demande, sans avoir à se justifier.
- Une annonce porte son mode de location, choisi par le loueur ; un conducteur ne peut demander que dans le mode proposé.
- La commission de l'exploitant est prélevée sur chaque location payée ; aucune n'y échappe.
- Entre la confirmation du loueur et le début de la location, l'argent du conducteur est détenu par la plateforme et n'appartient encore à personne.
- Une annulation ouvre droit à remboursement si elle intervient plus tôt que le délai fixé par l'exploitant avant le début de la location.
- Le prix est réglé par le loueur, place par place ; le délai d'annulation est réglé par l'exploitant, pour toute la plateforme.
- La marge prélevée par la plateforme sur une transaction est celle réglée par l'exploitant au moment où la transaction a lieu.
- Une réclamation porte sur une location et ne peut être déposée que par une des deux parties de cette location.
- Une réclamation n'est recevable qu'accompagnée d'une preuve.
- Aucune réclamation ne se solde d'elle-même ; son issue est toujours une décision de l'exploitant.
- Une somme gelée par une réclamation n'est versée à personne tant que l'exploitant n'a pas tranché.
- La confirmation d'arrivée appartient au conducteur seul ; personne ne peut confirmer à sa place.
- Le loueur est payé au premier des deux événements — confirmation d'arrivée du conducteur, ou expiration du délai de libération après le début de la location.
- Trois paramètres d'exploitation vivent au même endroit et appartiennent au même acteur — marge, délai d'annulation, délai de libération.
- Un loueur peut annuler une location confirmée à tout moment ; le conducteur est alors intégralement remboursé.
- Une demande de location est payée d'avance ; tant qu'elle n'est pas confirmée, la somme est bloquée et n'appartient à personne.
- Une demande non confirmée par le loueur est remboursée intégralement au conducteur.

## Cas vécus
- À Nice, se garer est très compliqué — c'est de là que vient l'idée du client.
- À Nice, des centaines de parkings dorment et personne ne s'en sert.
- Aujourd'hui l'alternative, c'est leboncoin — « c'est pas ouf, c'est pas fait pour louer des parkings ».

## Contraintes
- Projet pour un client externe, pas un produit interne : le propriétaire des réponses métier n'est pas forcément en séance.
- Marché géographique : Nice.
- Tension déclarée : `apps/front` est déclaré `role: frontend` (web) dans la config, le sujet dit « react native ».
- Le reversement à des tiers impose un prestataire de paiement adapté et une identité vérifiée avant le premier versement.
- L'atout de distribution du client porte sur la demande, pas sur l'offre.
- Une réclamation avec preuve implique l'envoi et le stockage d'un fichier depuis mobile.

## Questions ouvertes
- Q-04 (révisée) — la grille tarifaire est-elle dégressive par palier (jour/semaine/mois) ou non ? · tranché par JP · bloque le calcul du prix.
- Q-05 (révisée) — vocabulaire loueur/conducteur, en usage constant depuis le T6 mais jamais formellement reconfirmé · tranché par JP · bloque tout le glossaire.
- Q-06 — comment s'arrête le mode « reconduction » (résiliation, préavis) ? · tranché par JP (ou son client) · bloque paiement récurrent, résiliation, préavis.
- Q-11 — le back-office est-il une app de plus ? · tranché par JP · bloque `## 11. Impacts par app`.
- Q-12 — react native mobile pour loueur/conducteur, back-office web pour l'admin ? · tranché par JP · bloque le découpage des apps.
- Q-13 — un changement de délai d'annulation ou de marge s'applique-t-il aux réservations déjà confirmées ? · tranché par JP · bloque la règle de remboursement et la règle de marge.
- Q-14 — combien de places par quartier pour qu'une recherche aboutisse ? · tranché par JP (ou son client) · décide le réalisme du lancement.
- Q-16 — sous quel délai après la fin d'une location une réclamation est-elle recevable ? · tranché par JP · bloque la règle de recevabilité.
- Q-17 — quels mots distincts adopter pour les trois sens de « client » ? · tranché par JP · bloque le glossaire.
- Q-18 — au bout de combien de temps une demande non confirmée est-elle remboursée ? · tranché par JP · bloque la règle d'expiration.
- Q-19 — quels champs rendent une annonce publiable ? · tranché par JP · bloque les règles de publication, à récolter en phase 2.

## Ancrages code
Aucun — aucune ligne de code, aucun des trois répertoires d'app déclarés (`apps/api`, `apps/front`, `apps/e2e`) n'existe (dépôt initialisé au commit `99e18a5`).

## Périmètre
Dedans — place de marché entre particuliers à Nice ; location à la journée/semaine/mois à dates fixes ; grille tarifaire fixée par le loueur ; demande soumise à confirmation du loueur ; accès expliqué librement par le loueur ; paiement encaissé par l'app avec commission et reversement ; libération du versement à l'arrivée ou après délai ; remboursement selon délai d'annulation ou annulation loueur ; réclamation avec preuve tranchée par l'admin ; messagerie d'assistance utilisateur/back-office ; back-office (réservations, clients, statistiques, revenus, réglages) ; formulaire de publication en plusieurs étapes ; vérification d'identité et IBAN avant le premier versement.
Dehors — reconduction automatique (reportée, Q-06) ; location à l'heure (abandonnée) ; boîtier d'accès connecté (écarté) ; rôles et permissions fins du back-office ; édition par l'admin des prix des loueurs ; export comptable et facturation automatique ; messagerie intégrée loueur-conducteur ; gabarits de notification éditables.

## Décisions
- D-01 — place de marché entre particuliers, le client n'exploite aucune place.
- D-03 — le loueur fixe lui-même sa grille tarifaire.
- D-04 — la réservation n'est pas instantanée : le loueur accepte ou décline une demande.
- D-05 — l'accès au parking n'est pas un mécanisme de la plateforme, le loueur l'explique lui-même.
- D-06 (remplace D-02) — la location se fait à la journée, à la semaine ou au mois, plus à l'heure.
- D-07 — la confirmation du loueur reste obligatoire.
- D-08 — le loueur choisit, place par place, dates fixes et/ou reconduction.
- D-09 — les dates fixes sont livrées en premier, la reconduction est reportée.
- D-10 — l'application encaisse le conducteur, prélève une commission, reverse le solde au loueur.
- D-12 — l'éligibilité au remboursement dépend d'un délai réglé par l'exploitant.
- D-13 — un troisième acteur existe, l'admin, avec une surface propre : le back-office.
- D-14 — le back-office porte réservations, clients, statistiques, revenus, réglages de marge et de délai d'annulation.
- D-15 (délégué à Claude) — reste du contenu du back-office.
- D-16 — le découpage du back-office (D-15) est validé tel quel.
- D-17 — le conducteur dépose une réclamation avec preuve.
- D-18 — l'issue d'une réclamation est décidée par l'admin, au cas par cas.
- D-19 — il existe une messagerie d'assistance utilisateur/back-office.
- D-20 (remplace D-11) — le loueur est payé une fois que le conducteur a confirmé son arrivée.
- D-21 (délégué à Claude) — forme exacte du mécanisme de libération du versement.
- D-22 — mécanisme de libération : au premier des deux événements (confirmation d'arrivée, ou délai après le début) ; une réclamation ouverte avant libération gèle la somme.
- D-23 — si le loueur annule une location confirmée, le conducteur est intégralement remboursé, sans pénalité.
- D-24 — le conducteur est débité à sa demande ; l'argent est bloqué jusqu'à confirmation du loueur, rendu sinon.
- D-25 — objectif : des centaines de places de parking disponibles sur l'application.
- D-26 — la mise en location se fait par un formulaire en plusieurs étapes.

## Risques
- R-01 — accès physique rejoué à chaque réservation à l'heure · signal : remboursements/litiges « pas pu entrer » · parade : inconnue · gravité : forte — neutralisé par D-06.
- R-02 — tension entre location à l'heure et validation sur demande · signal : délai médian de réponse, demandes expirées · parade : inconnue · gravité : forte — neutralisé par D-06.
- R-03 — accès expliqué en texte libre, ni vérifiable ni opposable · signal : litiges sur l'accès · parade : inconnue · gravité : moyenne — actif.
- R-04 — deux modes de location doublent le produit (paiement, fin de vie, grille) · signal : nombre d'exemples reconduction vs dates fixes · parade : livrer un mode d'abord (D-09) · gravité : forte — parade appliquée.
- R-05 — vérification d'identité = mur à l'inscription du loueur · signal : part des annonces commencées jamais publiées · parade : vérification déclenchée avant le premier versement seulement · gravité : moyenne — actif.
- R-06 — versement parti avant que le conducteur puisse confirmer être garé · signal : réclamations le premier jour · parade : inconnue · gravité : forte — neutralisé par D-22.
- R-07 — l'offre, pas la demande, est le point dur d'une place de marché · signal : places publiées rapporté aux recherches sans résultat · parade : inconnue · gravité : forte — actif, devenu la métrique de succès.
- R-08 — un conducteur qui ne confirme jamais bloque le versement au loueur · signal : part des locations jamais confirmées, délai médian de versement · parade : libération automatique après délai (D-22) · gravité : forte — parade appliquée.
- R-09 — annulation gratuite pour le loueur, coûteuse pour le conducteur · signal : taux d'annulation loueur, part des conducteurs qui ne reviennent pas · parade : aucune, par décision assumée de JP · gravité : moyenne — actif.

## Cadrages rejetés et pourquoi
- Accès par code de portail, remise de télécommande ou boîtier connecté — écartés au profit d'un accès expliqué librement par le loueur, sans matériel ni champ imposé.
- Mise en relation seule, sans encaissement — écartée : la commission ne serait pas perçue et aucun levier ne resterait sur l'annulation ou le no-show.
- Location à l'heure — écartée en cours de séance : trop contraignante à l'usage (« c'est trop galère à l'heure »).
- Versement au loueur dès le début de la location — écarté en cours de séance : impossible de récupérer l'argent chez un particulier une fois versé.
