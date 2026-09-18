---
spec: SPEC-001
langue: fr
entrees:
  - { us: US-007, date: null, titre: "Dépublier une annonce ne libère jamais les dates déjà louées" }
  - { us: US-006, date: null, titre: "Une demande de location porte sur des dates réellement libres, à un prix figé" }
  - { us: US-004, date: null, titre: "Une grille tarifaire doit toujours proposer au moins un tarif" }
  - { us: US-003, date: null, titre: "Une même place ne peut plus recevoir deux annonces actives" }
  - { us: US-002, date: null, titre: "Une annonce incomplète ou usurpée n'est plus publiée" }
---

# Publier une place — ce qui change pour toi

## Dépublier une annonce ne libère jamais les dates déjà louées

**Ce qui change** — Tu peux désormais dépublier ton annonce à tout moment. Une location déjà confirmée
sur cette place n'est pas affectée : elle reste confirmée normalement. Redemander la dépublication d'une
annonce déjà dépubliée ne fait rien de plus, sans t'afficher d'erreur.

**Pour qui** — Les loueurs qui dépublient une annonce, et les conducteurs qui la consultaient ou
essaient de la demander après coup.

**Ce que tu vois maintenant** — Dès que tu dépublies ton annonce, elle n'est plus consultable
publiquement. Une location déjà confirmée sur cette place, elle, reste confirmée : aucune de ses dates
n'est libérée. Si tu redemandes la dépublication d'une annonce déjà dépubliée, elle reste dépubliée et
rien ne t'est signalé comme une erreur. Un conducteur qui demande une place sur une annonce dépubliée
voit sa demande refusée, et aucune demande n'est enregistrée pour elle. Tu peux ensuite publier une
nouvelle annonce pour cette même place : elle devient la seule annonce active du box. Un autre loueur qui
tente de dépublier ton annonce en est empêché — la dépublication lui est refusée parce que l'annonce ne
lui appartient pas — et ton annonce reste active.

**Ce qu'il faut faire différemment** — Rien : dépublier ne casse jamais une location en cours, et
personne d'autre que toi ne peut dépublier ton annonce.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-001","story":"US-007","ex":["EX-11","EX-33","EX-31","EX-13","EX-43"],"pr":null} -->

## Une demande de location porte sur des dates réellement libres, à un prix figé

**Ce qui change** — Un conducteur peut désormais demander une place sur une période précise. La
demande n'est recevable que si aucune de ces dates n'est déjà couverte par une location confirmée sur
cette place, y compris son tout dernier jour. Le prix retenu est celui de la grille tarifaire au moment
de la demande : il ne change plus si le loueur modifie ensuite ses tarifs.

**Pour qui** — Les conducteurs qui demandent une place, et les loueurs dont l'annonce reçoit des
demandes.

**Ce que tu vois maintenant** — Demander une place sur des dates libres après une location en cours est
accepté, et l'annonce reste publiée pendant toute la durée de cette location. Demander des dates déjà
couvertes par une location, y compris son tout dernier jour, est refusé : ces dates te sont signalées
comme déjà louées, et aucune demande n'est enregistrée pour elles. Une demande faite avec l'heure de ton
téléphone réglée sur un autre pays porte toujours sur la journée entière en heure de Paris, de minuit à
23h59, jamais sur une partie de la veille ou du lendemain. Une période demandée de plus de `366` jours
est refusée, tout comme des dates impossibles à lire.

**Ce qu'il faut faire différemment** — Rien : le prix affiché au moment de ta demande reste le tien
même si le loueur change sa grille juste après.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-001","story":"US-006","ex":["EX-09","EX-10","EX-22","EX-28","EX-29","EX-40","EX-41"],"pr":17} -->

## Une grille tarifaire doit toujours proposer au moins un tarif

**Ce qui change** — Une grille tarifaire doit désormais proposer au moins un tarif, à la journée, à la
semaine ou au mois. Tu peux n'en fixer qu'un seul — par exemple uniquement un tarif au mois — mais tu ne
peux plus publier, ni modifier, une grille qui n'en propose aucun. Un tarif à `0,00 €` reste un tarif
valide, distinct de l'absence de tarif.

**Pour qui** — Les loueurs qui publient une place ou modifient la grille tarifaire d'une annonce déjà
active.

**Ce que tu vois maintenant** — Une grille qui ne porte que le tarif au mois, par exemple `180,00 €`, est
publiée et ton annonce devient active. Si ta grille ne porte aucun tarif — ni journée, ni semaine, ni
mois — la publication est refusée et la grille tarifaire t'est signalée comme incomplète. Si tu retires
le dernier tarif restant d'une grille déjà publiée, la modification est refusée de la même façon et ta
grille garde son tarif précédent. Un tarif à `0,00 €` est publié normalement, sans qu'aucun plancher ni
plafond de prix ne te soit opposé.

**Ce qu'il faut faire différemment** — Vérifie que ta grille tarifaire porte toujours au moins un tarif,
à la publication comme à chaque modification.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-001","story":"US-004","ex":["EX-07","EX-24","EX-06","EX-25"],"pr":15} -->

## Une même place ne peut plus recevoir deux annonces actives

**Ce qui change** — Une place, identifiée par son adresse et son numéro de box, ne peut plus porter
qu'une seule annonce active à la fois. Que ce soit toi qui republies, ou un autre loueur qui publie sur
le même box, la seconde publication est refusée — même quand l'adresse ou le numéro de box sont écrits
autrement (majuscules, espace en trop).

**Pour qui** — Les loueurs qui publient une annonce.

**Ce que tu vois maintenant** — Si la place que tu publies porte déjà une annonce active, ta publication
est refusée avec le message « Cette place a déjà une annonce active », et l'annonce déjà active pour
cette place n'est pas modifiée. Publier un autre box à la même adresse fonctionne normalement : les deux
annonces restent actives, une par box.

**Ce qu'il faut faire différemment** — Rien, tant que tu publies une seule annonce par place. Si tu veux
republier la même place, dépublie d'abord l'annonce active existante.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-001","story":"US-003","ex":["EX-02","EX-14","EX-15","EX-16","EX-35","EX-38","EX-39"],"pr":14} -->

## Une annonce incomplète ou usurpée n'est plus publiée

**Ce qui change** — Une annonce ne peut plus être publiée si sa période de disponibilité est déjà
entièrement passée, si l'enregistrement d'une de ses photos échoue, ou si elle ne porte aucune photo.
Publier une annonce demande d'être connecté, et l'annonce est toujours publiée en ton nom, jamais au nom
de quelqu'un d'autre.

**Pour qui** — Les loueurs qui publient une place.

**Ce que tu vois maintenant** — Si tu choisis une période déjà passée, la publication est refusée avec
le message « La période de disponibilité est déjà passée ». Si l'enregistrement d'une photo échoue, tu
vois « Impossible d'enregistrer les photos » et aucune annonce, même incomplète, n'apparaît. Si tu ne
mets aucune photo, la publication est refusée et l'absence de photo t'est signalée. Si tu n'es pas
connecté, une connexion t'est demandée. Et même si tu indiques un autre loueur dans le formulaire,
l'annonce reste publiée sous ton propre compte.

**Ce qu'il faut faire différemment** — Vérifie que ta période de disponibilité n'est pas déjà terminée
et que tes photos sont bien envoyées avant de publier. Connecte-toi avant de publier une annonce.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-001","story":"US-002","ex":["EX-18","EX-19","EX-04","EX-36","EX-37"],"pr":13} -->
