---
id: SPEC-001
titre: Publier une place de parking en location
slug: publier-une-place
statut: valide
revision: 6
derive_de: BR-20260910-reserver-et-louer-une-place@d3bf33b
amont: present
langue: fr
valide_le: 2026-09-17
valide_par: jp-way:auto
apps: [api, mobile, e2e]
code_sha: { api: d3bf33b, mobile: d3bf33b, e2e: d3bf33b }
regles: 8
exemples: 41
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-001 · Publier une place de parking en location

## 1. Sujet

Pour un loueur niçois qui a une place de parking inutilisée, publier cette place en location à dates fixes — journée, semaine ou mois — avec sa propre grille tarifaire, afin qu'un conducteur puisse la trouver et la demander.

Le sujet a été lu et validé tel quel en séance. Les trois autres blocs du brainstorm — demander et confirmer, circuit de l'argent, annulation et réclamation — sont découpés en SPEC-002, SPEC-003 et SPEC-004.

## 2. Périmètre

**Dedans.** La mise en ligne d'une annonce par un loueur : l'adresse, le numéro de box, la description de l'accès, les photos, la grille tarifaire et la période de disponibilité. L'unicité de l'annonce active pour une même place. Le calcul du prix d'une durée à partir de la grille du loueur. La visibilité publique de l'adresse exacte. L'effet d'une location déjà confirmée sur les dates encore demandables. La dépublication d'une annonce par son loueur. Le fait que publier n'exige ni identité vérifiée ni coordonnées bancaires.

**Dehors.** L'acceptation ou le refus d'une demande par le loueur, le paiement du conducteur, la commission de l'exploitant, le versement au loueur, l'annulation, le remboursement et la réclamation : ces comportements appartiennent aux specs suivantes. Une demande n'apparaît ici que comme signal d'entrée — pour dire quel prix elle porte et si les dates sont encore disponibles — jamais comme objet géré de bout en bout.

## 3. Glossaire

| Terme | Sens retenu, et à n'écrire que comme ça |
|---|---|
| Loueur | le particulier qui met sa place en location et fixe sa grille tarifaire. Jamais « locataire », jamais « propriétaire ». |
| Conducteur | celui qui cherche une place, la demande et s'y gare. Jamais « client ». |
| Exploitant | celui qui opère la plateforme, encaisse la commission et tranche les réclamations. Hors périmètre de cette spec. |
| Place | l'emplacement physique loué, identifié par le couple adresse + numéro de box. |
| Box | le numéro d'emplacement au sein d'une adresse ; deux voisins d'un même immeuble ont deux places à la même adresse. |
| Annonce | la publication d'une place par son loueur : adresse, box, description de l'accès, photos, grille tarifaire, période de disponibilité. |
| Annonce active | une annonce publiée et consultable ; une place n'en porte qu'une à la fois. |
| Grille tarifaire | le barème fixé par le loueur, par durée — jour, semaine, mois. |
| Palier | une durée de la grille et son prix : la journée, la semaine, le mois. |
| Période de disponibilité | l'intervalle de dates, début et fin, sur lequel l'annonce est ouverte aux demandes. |
| Demande | l'intention de location d'un conducteur, non encore acceptée. Jamais « réservation » ici. |
| Dépublication | le retrait d'une annonce par son loueur ; l'annonce cesse d'être consultable. |

## 4. Règles et exemples

### RG-01 · une place, identifiée par son adresse et son numéro de box, ne peut avoir qu'une seule annonce active

#### EX-01 · une première annonce pour une place qui n'en a aucune

Étant donné le loueur `Marc D.` et sa place au `12 rue Barla, 06300 Nice`, `box 12`,
  pour laquelle aucune annonce active n'existe
Quand `Marc D.` publie une annonce pour cette place le `10/09/2026`
Alors l'annonce est active
Et elle est la seule annonce active du `box 12` du `12 rue Barla, 06300 Nice`

<!-- jp-way:ex {"id":"EX-01","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"c4326941"} -->

#### EX-02 · une seconde annonce pour la place déjà annoncée

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand `Marc D.` publie une seconde annonce pour ce même box le `11/09/2026`
Alors la publication est refusée avec « Cette place a déjà une annonce active »
Et aucune seconde annonce n'existe pour le `box 12` du `12 rue Barla, 06300 Nice`
Et la première annonce reste active

<!-- jp-way:ex {"id":"EX-02","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"9422c560"} -->


#### EX-13 · republier la même place après l'avoir dépubliée

Étant donné l'annonce de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`,
  dépubliée le `10/10/2026`
Quand `Marc D.` publie une nouvelle annonce pour ce même box le `12/10/2026`
Alors la nouvelle annonce est active
Et elle est la seule annonce active du `box 12` du `12 rue Barla, 06300 Nice`

<!-- jp-way:ex {"id":"EX-13","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"4067f33a"} -->

#### EX-14 · un autre loueur publie le box déjà annoncé

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand le loueur `Pierre L.` publie une annonce pour le `box 12` du `12 rue Barla, 06300 Nice`
Alors la publication est refusée avec « Cette place a déjà une annonce active »
Et l'annonce de `Marc D.` reste la seule active pour ce box
Et aucune annonce de `Pierre L.` n'existe pour ce box

<!-- jp-way:ex {"id":"EX-14","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"575cdec5"} -->

#### EX-35 · un autre box à la même adresse

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand son voisin `Pierre L.` publie une annonce pour le `box 14` du `12 rue Barla, 06300 Nice`
Alors la publication est acceptée
Et les deux annonces sont actives, celle du `box 12` et celle du `box 14`

<!-- jp-way:ex {"id":"EX-35","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"72eebb9c"} -->

#### EX-15 · publier pendant une location en cours sur la place

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`,
  louée du `01/10/2026` au `31/10/2026`
Quand `Marc D.` publie une nouvelle annonce pour ce box le `15/10/2026`
Alors la publication est refusée avec « Cette place a déjà une annonce active »
Et l'annonce existante reste la seule active
Et la location du `01/10/2026` au `31/10/2026` n'est pas touchée

<!-- jp-way:ex {"id":"EX-15","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"83a12eee"} -->

#### EX-16 · la même adresse écrite autrement, le même box

Étant donné l'annonce active de `Marc D.` portant `12 rue barla, 06300 nice` et le `box 12`
Quand `Pierre L.` publie une annonce portant `12 Rue Barla, 06300 NICE` et le `box 12`
Alors la publication est refusée avec « Cette place a déjà une annonce active »
Et aucune seconde annonce n'existe pour ce couple adresse + box
Et les deux écritures désignent la même place

<!-- jp-way:ex {"id":"EX-16","regle":"RG-01","origine":"sonde","barreau":"int-repo","empreinte":"0c2e49e5"} -->

#### EX-38 · le même box écrit avec une espace en trop

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand `Pierre L.` publie une annonce pour le box `12 ` du `12 rue Barla, 06300 Nice`
Alors la publication est refusée avec « Cette place a déjà une annonce active »
Et aucune annonce de `Pierre L.` n'existe pour ce box

<!-- jp-way:ex {"id":"EX-38","regle":"RG-01","origine":"bug","barreau":"unit","empreinte":"8dbd2ebb"} -->

#### EX-39 · deux publications simultanées de la même place écrite autrement

Étant donné aucune annonce active pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand `Marc D.` publie `12 rue barla, 06300 nice` et le `box 12`,
  et au même instant `Pierre L.` publie `12 Rue Barla, 06300 NICE` suivi d'un retour à la ligne et le `box 12`
Alors une seule des deux annonces est active pour cette place
Et l'autre publication est refusée avec « Cette place a déjà une annonce active »

<!-- jp-way:ex {"id":"EX-39","regle":"RG-01","origine":"bug","barreau":"int-repo","empreinte":"82c89208"} -->

### RG-02 · une annonce n'est publiable que si elle porte une adresse, un numéro de box, une description de l'accès, au moins une photo, une grille tarifaire et une période de disponibilité

#### EX-03 · une annonce complète est publiée

Étant donné l'annonce de `Marc D.` portant `12 rue Barla, 06300 Nice`, le `box 12`,
  la description d'accès « portail bleu à gauche du 12, le box est au fond du premier sous-sol »,
  une photo, une grille à `12,00 €` la journée, `60,00 €` la semaine, `180,00 €` le mois,
  et une disponibilité du `01/10/2026` au `31/10/2026`
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors l'annonce est active
Et elle affiche son adresse, son box, sa description d'accès, sa photo, sa grille et sa période

<!-- jp-way:ex {"id":"EX-03","regle":"RG-02","origine":"mapping","barreau":"e2e","empreinte":"ecb18b1a"} -->

#### EX-04 · une annonce sans aucune photo

Étant donné l'annonce de `Marc D.` portant `12 rue Barla, 06300 Nice`, le `box 12`,
  sa description d'accès, sa grille `12,00 € / 60,00 € / 180,00 €`
  et sa disponibilité du `01/10/2026` au `31/10/2026`, mais aucune photo
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors la publication est refusée et l'absence de photo est signalée
Et aucune annonce n'est active pour le `box 12` du `12 rue Barla, 06300 Nice`

<!-- jp-way:ex {"id":"EX-04","regle":"RG-02","origine":"mapping","barreau":"int-http","empreinte":"463074f7"} -->

#### EX-17 · une annonce portant exactement une photo

Étant donné l'annonce complète de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`,
  portant exactement une photo
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors l'annonce est active
Et la photo est affichée sur l'annonce

<!-- jp-way:ex {"id":"EX-17","regle":"RG-02","origine":"sonde","barreau":"unit","empreinte":"c4811539"} -->

#### EX-18 · une période de disponibilité entièrement passée

Étant donné l'annonce complète de `Marc D.` dont la disponibilité va du `01/10/2025` au `31/10/2025`
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors la publication est refusée avec « La période de disponibilité est déjà passée »
Et aucune annonce n'est active pour le `box 12` du `12 rue Barla, 06300 Nice`

<!-- jp-way:ex {"id":"EX-18","regle":"RG-02","origine":"sonde","barreau":"unit","empreinte":"6b6dff30"} -->

#### EX-19 · le stockage des photos répond une erreur

Étant donné l'annonce complète de `Marc D.` portant une photo,
  et le stockage des photos qui répond une erreur à tout envoi
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors la publication est refusée avec « Impossible d'enregistrer les photos »
Et aucune annonce, même incomplète, n'existe pour le `box 12` du `12 rue Barla, 06300 Nice`

<!-- jp-way:ex {"id":"EX-19","regle":"RG-02","origine":"sonde","barreau":"int-repo","empreinte":"fe908700"} -->

#### EX-36 · un visiteur non connecté publie une annonce

Étant donné un visiteur non connecté,
  et l'annonce complète pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand ce visiteur publie cette annonce le `10/09/2026`
Alors la publication est refusée et une connexion est demandée
Et aucune annonce n'est active pour le `box 12` du `12 rue Barla, 06300 Nice`

<!-- jp-way:ex {"id":"EX-36","regle":"RG-02","origine":"bug","barreau":"int-http","empreinte":"c0b202fc"} -->

#### EX-37 · un loueur connecté désigne un autre loueur dans son annonce

Étant donné `Marc D.` connecté,
  et l'annonce complète pour le `box 12` du `12 rue Barla, 06300 Nice` qui désigne `Pierre L.` comme loueur
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors l'annonce est publiée au nom de `Marc D.`
Et aucune annonce de `Pierre L.` n'existe pour le `box 12` du `12 rue Barla, 06300 Nice`

<!-- jp-way:ex {"id":"EX-37","regle":"RG-02","origine":"bug","barreau":"int-http","empreinte":"a589a181"} -->

### RG-03 · le prix d'une durée est la combinaison la moins chère des paliers proposés par la grille du loueur ; la plateforme n'impose aucun tarif

#### EX-05 · un mois entier au tarif du mois

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`,
  grille à `12,00 €` la journée, `60,00 €` la semaine, `180,00 €` le mois
Quand la conductrice `Léa T.` demande la place du `01/10/2026` au `31/10/2026`
Alors le prix de la demande est `180,00 €`
Et aucun tarif fixé par la plateforme ne s'applique

<!-- jp-way:ex {"id":"EX-05","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"a38aba96"} -->

#### EX-20 · dix jours facturés à la meilleure combinaison de paliers

Étant donné l'annonce active de `Marc D.`,
  grille à `12,00 €` la journée, `60,00 €` la semaine, `180,00 €` le mois
Quand `Léa T.` demande la place du `01/10/2026` au `10/10/2026`, soit dix jours
Alors le prix de la demande est `96,00 €`, soit une semaine à `60,00 €` et trois jours à `12,00 €`
Et ni `120,00 €` (dix journées) ni `180,00 €` (un mois) ne sont retenus

<!-- jp-way:ex {"id":"EX-20","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"b2e920b1"} -->

#### EX-21 · aucun palier ne couvre la période demandée

Étant donné l'annonce active de `Marc D.` dont la grille ne porte que le mois à `180,00 €`
Quand `Léa T.` demande la place du `01/10/2026` au `07/10/2026`, soit sept jours
Alors la demande est refusée, aucune durée proposée ne couvre la période
Et aucun prix n'est affiché pour ces sept jours

<!-- jp-way:ex {"id":"EX-21","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"f0a413ea"} -->

#### EX-22 · la grille change après une demande

Étant donné l'annonce active de `Marc D.`, grille au mois à `180,00 €`,
  et la demande de `Léa T.` du `01/10/2026` au `31/10/2026` faite le `01/10/2026` à `180,00 €`
Quand `Marc D.` porte le mois à `200,00 €` le `02/10/2026`
Alors la demande de `Léa T.` reste à `180,00 €`
Et `200,00 €` ne s'applique qu'aux demandes faites après le `02/10/2026`

<!-- jp-way:ex {"id":"EX-22","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"36c71a77"} -->

#### EX-23 · une combinaison de paliers au centime près

Étant donné l'annonce active de `Marc D.`, grille à `12,50 €` la journée et `58,33 €` la semaine
Quand `Léa T.` demande la place du `01/10/2026` au `10/10/2026`, soit dix jours
Alors le prix de la demande est `95,83 €`, soit une semaine à `58,33 €` et trois jours à `12,50 €`
Et le montant est exprimé au centime, sans arrondi supplémentaire

<!-- jp-way:ex {"id":"EX-23","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"c4c346a1"} -->

### RG-04 · une grille tarifaire propose au moins une durée ; le loueur choisit lesquelles parmi jour, semaine et mois

#### EX-06 · une grille qui ne porte que le mois

Étant donné l'annonce complète de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`,
  dont la grille porte `180,00 €` le mois, et ni tarif à la journée ni tarif à la semaine
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors l'annonce est active
Et sa grille ne propose que le mois à `180,00 €`

<!-- jp-way:ex {"id":"EX-06","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"e0cbbcb5"} -->

#### EX-07 · une grille sans aucune durée

Étant donné l'annonce complète de `Marc D.` dont la grille ne porte ni journée, ni semaine, ni mois
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors la publication est refusée et la grille tarifaire est signalée comme incomplète
Et aucune annonce n'est active pour le `box 12` du `12 rue Barla, 06300 Nice`

<!-- jp-way:ex {"id":"EX-07","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"c8c2f730"} -->

#### EX-24 · retirer la dernière durée d'une grille déjà publiée

Étant donné l'annonce active de `Marc D.` dont la grille ne porte que le mois à `180,00 €`
Quand `Marc D.` retire le tarif au mois de cette grille le `12/09/2026`
Alors la modification est refusée et la grille tarifaire est signalée comme incomplète
Et la grille de l'annonce porte toujours `180,00 €` le mois

<!-- jp-way:ex {"id":"EX-24","regle":"RG-04","origine":"sonde","barreau":"unit","empreinte":"1c2a81f2"} -->

#### EX-25 · une grille à 0,00 €

Étant donné l'annonce complète de `Marc D.` dont la grille porte `0,00 €` le mois
Quand `Marc D.` publie cette annonce le `10/09/2026`
Alors l'annonce est publiée et devient active
Et aucune borne de prix, ni plancher ni plafond, ne lui est opposée

<!-- jp-way:ex {"id":"EX-25","regle":"RG-04","origine":"sonde","barreau":"unit","empreinte":"e5220fa6"} -->

### RG-05 · l'adresse exacte est visible sur l'annonce, avant toute réservation

#### EX-08 · une conductrice consulte l'annonce sans avoir rien demandé

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`,
  et `Léa T.` connectée, qui n'a fait aucune demande sur cette annonce
Quand `Léa T.` ouvre l'annonce le `12/09/2026`
Alors elle voit `12 rue Barla, 06300 Nice` et le `box 12`
Et aucune réservation ni confirmation ne lui est demandée pour voir l'adresse

<!-- jp-way:ex {"id":"EX-08","regle":"RG-05","origine":"mapping","barreau":"int-http","empreinte":"6742a31f"} -->

#### EX-26 · un visiteur non connecté consulte l'annonce

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand un visiteur non connecté ouvre l'annonce le `12/09/2026`
Alors il voit `12 rue Barla, 06300 Nice` et le `box 12`
Et aucune authentification ne lui est demandée pour lire l'adresse

<!-- jp-way:ex {"id":"EX-26","regle":"RG-05","origine":"sonde","barreau":"int-http","empreinte":"62bb715f"} -->

#### EX-27 · l'annonce dépubliée ne montre plus rien

Étant donné l'annonce de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`,
  dépubliée le `10/10/2026`
Quand `Léa T.` ouvre le lien de cette annonce le `11/10/2026`
Alors elle voit « Annonce introuvable »
Et ni `12 rue Barla, 06300 Nice` ni le `box 12` ne sont affichés

<!-- jp-way:ex {"id":"EX-27","regle":"RG-05","origine":"sonde","barreau":"int-http","empreinte":"4a3d546a"} -->

### RG-06 · une annonce reste publiée pendant une location, et les dates déjà louées ne sont plus demandables

#### EX-09 · des dates libres après la location en cours

Étant donné l'annonce active de `Marc D.`, louée du `01/10/2026` au `31/10/2026`
Quand `Léa T.` demande la place du `05/11/2026` au `12/11/2026`
Alors la demande est recevable
Et l'annonce reste publiée pendant toute la location d'octobre

<!-- jp-way:ex {"id":"EX-09","regle":"RG-06","origine":"mapping","barreau":"unit","empreinte":"1c7986c8"} -->

#### EX-10 · des dates déjà louées

Étant donné l'annonce active de `Marc D.`, louée du `01/10/2026` au `31/10/2026`
Quand `Léa T.` demande la place du `15/10/2026` au `20/10/2026`
Alors la demande est refusée, ces dates sont déjà louées
Et aucune demande n'est enregistrée pour ces dates

<!-- jp-way:ex {"id":"EX-10","regle":"RG-06","origine":"mapping","barreau":"unit","empreinte":"2d7b4d3c"} -->

#### EX-28 · le dernier jour loué reste indisponible

Étant donné l'annonce active de `Marc D.`, louée du `01/10/2026` au `31/10/2026`
Quand `Léa T.` demande la place du `31/10/2026` au `05/11/2026`
Alors la demande est refusée, le `31/10/2026` est déjà loué
Et aucune demande n'est enregistrée pour cette période

<!-- jp-way:ex {"id":"EX-28","regle":"RG-06","origine":"sonde","barreau":"unit","empreinte":"d0e3da6c"} -->

#### EX-29 · une journée demandée depuis un autre fuseau

Étant donné l'annonce active de `Marc D.`, aucune location confirmée,
  et `Léa T.` dont l'appareil est réglé sur `America/New_York`
Quand `Léa T.` demande la journée du `15/10/2026` le `14/10/2026` à `20:00` heure locale
Alors la demande porte sur le `15/10/2026`, de `00:00` à `23:59` en `Europe/Paris`
Et aucune partie du `14/10/2026` ni du `16/10/2026` n'est retenue

<!-- jp-way:ex {"id":"EX-29","regle":"RG-06","origine":"sonde","barreau":"unit","empreinte":"f741bf4e"} -->

#### EX-40 · une période demandée démesurément longue

Étant donné l'annonce active de `Marc D.`, grille à `180,00 €` le mois, aucune location confirmée
Quand `Léa T.` demande la place du `01/01/2026` au `31/12/9999`
Alors la demande est refusée, la période dépasse la durée maximale de `366` jours
Et aucune demande n'est enregistrée pour cette période

<!-- jp-way:ex {"id":"EX-40","regle":"RG-06","origine":"bug","barreau":"unit","empreinte":"c2a1f9a6"} -->

#### EX-41 · une date de demande impossible

Étant donné l'annonce active de `Marc D.`, louée du `01/10/2026` au `31/10/2026`
Quand `Léa T.` demande la place du `01/10/2026` au `45/13/2026`
Alors la demande est refusée, les dates demandées sont invalides
Et aucune demande n'est enregistrée pour cette période

<!-- jp-way:ex {"id":"EX-41","regle":"RG-06","origine":"bug","barreau":"unit","empreinte":"b72de22e"} -->

#### EX-30 · deux conducteurs demandent les mêmes dates au même instant

Étant donné l'annonce active de `Marc D.`, les dates du `05/11/2026` au `12/11/2026` libres
Quand `Léa T.` et le conducteur `Karim B.` demandent ces dates au même instant,
  le `20/10/2026` à `18:30:00 Europe/Paris`
Alors une seule des deux demandes est enregistrée
Et l'autre est refusée pour dates indisponibles

<!-- jp-way:ex {"id":"EX-30","regle":"RG-06","origine":"sonde","barreau":"int-repo","empreinte":"e98ef649"} -->

#### EX-31 · une demande sur une annonce dépubliée

Étant donné l'annonce de `Marc D.`, dépubliée le `10/10/2026`
Quand `Léa T.` demande la place du `05/11/2026` au `12/11/2026` le `11/10/2026`
Alors la demande est refusée
Et aucune demande n'est enregistrée sur cette annonce

<!-- jp-way:ex {"id":"EX-31","regle":"RG-06","origine":"sonde","barreau":"unit","empreinte":"bd5b02a4"} -->

### RG-07 · un loueur peut dépublier son annonce à tout moment, sans effet sur les locations déjà confirmées

#### EX-11 · dépublier alors qu'une location est confirmée

Étant donné l'annonce active de `Marc D.`, dont la location du `01/10/2026` au `31/10/2026`
  est confirmée
Quand `Marc D.` dépublie son annonce le `10/10/2026`
Alors l'annonce n'est plus consultable publiquement
Et la location du `01/10/2026` au `31/10/2026` reste confirmée
Et aucune date déjà louée n'est libérée

<!-- jp-way:ex {"id":"EX-11","regle":"RG-07","origine":"mapping","barreau":"unit","empreinte":"9e24fb4c"} -->

#### EX-32 · une demande arrive à l'instant de la dépublication

Étant donné l'annonce active de `Marc D.`,
  et la demande de `Léa T.` du `05/11/2026` au `12/11/2026` émise le `10/10/2026` à `14:00:00 Europe/Paris`
Quand `Marc D.` dépublie son annonce le `10/10/2026` à `14:00:00 Europe/Paris`
Alors la demande de `Léa T.` est refusée
Et l'annonce est dépubliée
Et aucune demande n'est enregistrée sur cette annonce

<!-- jp-way:ex {"id":"EX-32","regle":"RG-07","origine":"sonde","barreau":"int-repo","empreinte":"feba9bc9"} -->

#### EX-33 · dépublier une annonce déjà dépubliée

Étant donné l'annonce de `Marc D.`, dépubliée le `10/10/2026`,
  dont la location du `01/10/2026` au `31/10/2026` est confirmée
Quand `Marc D.` demande la dépublication de cette annonce le `11/10/2026`
Alors l'annonce reste dépubliée
Et aucune erreur n'est affichée à `Marc D.`
Et la location du `01/10/2026` au `31/10/2026` reste confirmée

<!-- jp-way:ex {"id":"EX-33","regle":"RG-07","origine":"sonde","barreau":"unit","empreinte":"e1ed63cf"} -->

### RG-08 · publier une annonce n'exige ni identité vérifiée ni IBAN

#### EX-12 · publier sans pièce d'identité ni IBAN

Étant donné `Marc D.`, compte créé le `09/09/2026`, qui n'a fourni ni pièce d'identité ni IBAN
Quand `Marc D.` publie son annonce complète pour le `box 12` du `12 rue Barla, 06300 Nice`
  le `10/09/2026`
Alors l'annonce est active
Et ni pièce d'identité ni IBAN ne lui sont demandés pour publier

<!-- jp-way:ex {"id":"EX-12","regle":"RG-08","origine":"mapping","barreau":"unit","empreinte":"45746fb7"} -->

#### EX-34 · une vérification d'identité commencée et non terminée

Étant donné `Marc D.`, qui a commencé une vérification d'identité le `09/09/2026`
  sans jamais la terminer
Quand `Marc D.` publie son annonce complète pour le `box 12` du `12 rue Barla, 06300 Nice`
  le `10/09/2026`
Alors l'annonce est active
Et la vérification inachevée ne bloque pas la publication

<!-- jp-way:ex {"id":"EX-34","regle":"RG-08","origine":"sonde","barreau":"unit","empreinte":"fbe04369"} -->

## 5. Sonde de couverture

Huit règles croisées avec les dix dimensions : 80 intersections, toutes résolues. La seconde passe de récolte n'ayant pas eu lieu en séance, cette grille est le seul filet de la spec.

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | EX-01 EX-02 | écarté¹ | EX-13 | EX-39 filet² | EX-14 | EX-15 | écarté³ | écarté⁴ | écarté⁵ | EX-16 EX-38 |
| RG-02 | EX-17 | EX-04 filet⁶ | EX-18 | écarté⁷ | EX-36 EX-37 | écarté⁹ | écarté¹⁰ | filet¹¹ | EX-19 | filet¹² |
| RG-03 | EX-20 | EX-21 | EX-22 | écarté¹³ | écarté¹⁴ | écarté¹⁵ | EX-23 | écarté¹⁶ | écarté⁵ | écarté¹⁷ |
| RG-04 | EX-06 EX-07 | EX-07 | écarté¹⁸ | écarté¹³ | filet⁸ | EX-24 | EX-25 | écarté¹⁶ | écarté⁵ | écarté¹⁷ |
| RG-05 | écarté¹⁹ | écarté²⁰ | écarté¹⁸ | écarté¹³ | EX-26 | EX-27 | écarté³ | écarté⁴ | écarté⁵ | écarté¹⁷ |
| RG-06 | EX-28 | EX-09 | EX-29 | EX-30 | filet⁸ | EX-31 | écarté³ | EX-40 filet²¹ | écarté⁵ | EX-41 |
| RG-07 | écarté¹⁹ | EX-11 | écarté²² | EX-32 | filet²³ | EX-33 | écarté³ | écarté⁴ | écarté⁵ | écarté¹⁷ |
| RG-08 | écarté¹⁹ | EX-12 | écarté¹⁸ | écarté¹³ | écarté²⁴ | EX-34 | écarté²⁵ | écarté⁴ | écarté⁵ | écarté¹⁷ |

¹ l'absence d'annonce pour une place est le cas nominal, déjà porté par EX-01.
² contrainte d'unicité en base sur l'identifiant de place restreinte aux annonces actives — à créer dans la migration de cette spec.
³ cette règle ne porte sur aucun montant.
⁴ la règle porte sur une place unique, jamais sur une liste.
⁵ aucun appel à un tiers dans ce chemin.
⁶ l'absence d'un champ obligatoire est refusée par la validation de la requête ; EX-04 en est le représentant testé.
⁷ deux publications concurrentes pour la même place relèvent de RG-01, pas de RG-02.
⁸ garde d'authentification sur la route, et vérification que le loueur agit sur sa propre annonce.
⁹ publier une annonce déjà publiée relève de RG-01.
¹⁰ le contenu de la grille relève de RG-04, pas de la complétude de l'annonce.
¹¹ nombre et taille des fichiers bornés par la validation à la frontière HTTP.
¹² longueur maximale et jeu de caractères portés par le schéma de la requête.
¹³ le calcul comme la publication sont des opérations uniques, sans état partagé concurrent.
¹⁴ le calcul du prix ne dépend d'aucun rôle.
¹⁵ le calcul ne dépend pas de l'état de l'annonce.
¹⁶ une demande porte sur une seule place.
¹⁷ aucune saisie libre n'entre dans ce chemin.
¹⁸ cette règle ne lit aucune donnée temporelle.
¹⁹ cette règle n'a pas de borne numérique.
²⁰ l'adresse est un champ obligatoire, son absence relève de RG-02.
²¹ index sur les dates de location et pagination de l'historique d'une annonce.
²² la règle ne dépend pas de l'instant de la dépublication.
²³ vérification que le loueur est propriétaire de l'annonce qu'il dépublie.
²⁴ la règle énonce précisément qu'aucune vérification n'est exigée pour publier.
²⁵ publier ne déclenche aucun mouvement d'argent.

EX-41 est né de la revue de sécurité de US-006 (AUTO-19) : une date impossible échappait à toutes les gardes. EX-40 est né de la revue de sécurité de US-006 (AUTO-17) : une période demandée sans borne bloquerait l'api. Les cellules RG-06 × Données et RG-06 × Autorisation restent fausses tant que la route de demande n'existe pas (AUTO-18).

EX-38 et EX-39 sont nés de la revue de sécurité de US-003 (AUTO-08) : une place est reconnue par une clé normalisée que la base contraint aussi.

EX-36 et EX-37 sont nés de la revue de sécurité de US-002 (registre autonome, AUTO-01) : ils remplacent le filet ⁸ de RG-02 × Autorisation par deux exemples. La vérification que le loueur agit sur sa propre annonce reste le filet ⁸ de RG-04, RG-06 et le filet ²³ de RG-07.

EX-35 est né de la résolution de Q-04, après la validation de la grille : il n'occupe aucune intersection et complète EX-14 sur le couple adresse + box.

## 6. Écrans

### UX-01 · Publier une place — formulaire en trois étapes

Rôle : un loueur met sa place en location.
Atteint depuis : l'accueil, bouton `Publier ma place`.

| État | Déclencheur | Ce qu'on voit | Exemple |
|---|---|---|---|
| étape 1 | ouverture | adresse, numéro de box | EX-03 |
| étape 2 | étape 1 valide | description de l'accès, photos | EX-17 |
| étape 3 | étape 2 valide | grille tarifaire, période de disponibilité | EX-06 EX-07 |
| refus | un champ obligatoire manque | le champ fautif est signalé, rien n'est publié | EX-04 |
| refus | une annonce active existe déjà pour ce box | « Cette place a déjà une annonce active » | EX-02 EX-14 EX-16 |
| refus | dates entièrement passées | « La période de disponibilité est déjà passée » | EX-18 |
| panne | le stockage des photos échoue | « Impossible d'enregistrer les photos » et le bouton `Réessayer` | EX-19 |
| succès | publication acceptée | l'annonce apparaît en « active » | EX-01 EX-03 |

### UX-02 · Mon annonce — vue du loueur

Rôle : un loueur consulte l'annonce qu'il a publiée, voit ce qui est loué, et la dépublie.
Atteint depuis : non tranché en séance.

| État | Déclencheur | Ce qu'on voit | Exemple |
|---|---|---|---|
| active | annonce publiée, aucune location | l'annonce, son adresse, sa grille, le bouton `Dépublier mon annonce` | EX-01 |
| louée | une location est confirmée | les dates louées sont marquées indisponibles | EX-09 |
| dépubliée | le loueur a dépublié | l'annonce n'est plus visible publiquement, la location confirmée reste affichée | EX-11 EX-33 |

### UX-03 · Annonce publique — vue du conducteur

Rôle : un conducteur lit l'annonce, son adresse exacte, sa grille et ses disponibilités avant de demander.
Atteint depuis : non tranché en séance.

| État | Déclencheur | Ce qu'on voit | Exemple |
|---|---|---|---|
| nominal | annonce active | `12 rue Barla, 06300 Nice`, le box, les photos, la grille, les disponibilités | EX-08 EX-26 |
| indisponible | dates déjà louées | les dates louées ne sont pas sélectionnables | EX-10 EX-28 |
| introuvable | annonce dépubliée | « Annonce introuvable », aucune adresse visible | EX-27 EX-31 |

**Noms accessibles** — le contrat avec les tests de parcours, pas une suggestion :
`bouton Publier ma place` · `champ Adresse` · `champ Numéro de box` · `champ Description de l'accès` ·
`bouton Ajouter une photo` · `champ Prix à la journée` · `champ Prix à la semaine` · `champ Prix au mois` ·
`champ Début de disponibilité` · `champ Fin de disponibilité` · `bouton Continuer` · `bouton Publier` ·
`bouton Réessayer` · `bouton Dépublier mon annonce` · `titre Annonce introuvable`

## 7. Questions

#### Q-01 · existe-t-il un prix plancher ou un prix plafond par durée ?

Statut : résolue — JP : « aucune borne : ni prix plancher, ni prix plafond. Le loueur met ce qu'il veut. »
Conséquence appliquée : EX-25, une grille à `0,00 €` le mois est publiée. Le manque à gagner que cela ouvre pour l'exploitant est porté en `## 11`.

#### Q-02 · quelle app du dépôt porte la publication d'une place ?

Statut : résolue — JP : deux apps, `mobile` pour le loueur et le conducteur, `bo` pour le back-office ; `front` est supprimée, rien n'existait sur le disque.
Conséquence appliquée : cette spec ne concerne que `api`, `mobile` et `e2e` ; `bo` n'est pas concernée, SPEC-001 ne touche aucun écran d'administration.

#### Q-03 · le volet conformité est-il tenable éteint, pour une plateforme qui encaisse et vérifie des identités ?

Statut : résolue — JP : le volet conformité est rallumé, cadre RGPD, données personnelles et données financières.
Conséquence appliquée : les obligations correspondantes sont portées en `## 8`.

#### Q-04 · qu'est-ce qui identifie « une place » pour RG-01 : l'adresse seule, ou l'adresse et un identifiant de box ?

Statut : résolue — JP : « une place est identifiée par son adresse et son numéro de box. »
Conséquence appliquée : RG-01 porte le couple adresse + box, RG-02 gagne le numéro de box parmi ses champs obligatoires, EX-14 et EX-16 portent sur le même box, et EX-35 dit qu'un autre box à la même adresse est publiable.

#### Q-05 · comment est facturée une durée qui ne tombe sur aucun palier, par exemple dix jours ?

Statut : résolue — JP : « la meilleure combinaison des paliers de la grille, au plus avantageux pour le conducteur ». Dix jours avec `12,00 €` la journée, `60,00 €` la semaine et `180,00 €` le mois valent donc `96,00 €`, une semaine plus trois jours.
Conséquence appliquée : RG-03 est écrite en ces termes, EX-20 vaut `96,00 €`, et EX-21 tient toujours — une grille qui ne porte que le mois ne compose pas sept jours.

## 8. Contraintes non fonctionnelles

- **Volumétrie visée.** L'objectif du brainstorm est de passer de zéro à plusieurs centaines de places publiées à Nice. Une annonce est lue bien plus souvent qu'écrite ; rien ici ne porte sur des lots.
- **Conformité.** Le cadre RGPD s'applique, sur données personnelles et données financières. Une annonce publique porte l'adresse exacte d'un particulier, et le loueur fournira plus tard une pièce d'identité et un IBAN : ces données sortent du périmètre de cette spec mais appartiennent au même compte.
- **Données personnelles exposées volontairement.** Par décision de JP (RG-05), l'adresse exacte et le numéro de box sont publics, sans authentification. C'est un choix assumé, pas un défaut à corriger plus tard sans le dire.
- **Fichiers.** Une annonce porte au moins une photo, envoyée depuis un appareil mobile ; le chemin de publication dépend donc d'un stockage de fichiers, dont la panne est un comportement spécifié (EX-19).
- **Temps.** Toutes les dates de location, et la journée comme unité, sont bornées sur `Europe/Paris`, quel que soit le fuseau de l'appareil (EX-29).
- **Langue.** Tout ce qu'un loueur ou un conducteur lit est en français.
- **Rétention.** Une annonce dépubliée est conservée douze mois à compter de sa dépublication, puis anonymisée : l'adresse, le numéro de box, la description de l'accès et les photos sont effacés, la ligne subsistant sans donnée personnelle pour les locations passées qui la référencent. Durée et mécanisme tranchés en construction autonome (ADR-003), faute de décision en séance ; la tâche qui applique l'anonymisation sort du périmètre de cette spec et est portée comme dette tracée.

## 9. Impacts par app

Aucun code n'existe : le dépôt ne porte aucune ligne d'application et aucune carte de code n'a jamais été dressée. Aucun `code-scout` n'a donc été dépêché, et rien de ce qui suit ne s'appuie sur du code observé.

| App | Ce qui bouge | Ce qui ne bouge pas |
|---|---|---|
| api | tout est à créer : les huit règles, l'unicité de l'annonce active sur le couple adresse + box, la complétude d'une annonce, le calcul du prix par combinaison de paliers, les dates encore demandables, la dépublication. | rien — il n'y a rien à préserver. |
| mobile | tout est à créer : les trois écrans de `## 6`, leurs états et leurs refus affichés. | rien — il n'y a rien à préserver. |
| e2e | tout est à créer : le parcours de publication d'une place, de l'accueil à l'annonce active. | rien — il n'y a rien à préserver. |
| bo | rien : SPEC-001 ne touche aucun écran d'administration. | l'ensemble du back-office. |

## 10. Hors sujet

- **Demander et confirmer une location** — l'acceptation ou le refus par le loueur, l'expiration d'une demande. Objet de SPEC-002 ; ici, une demande n'est qu'un signal d'entrée servant à dire quel prix elle porte et si les dates sont libres.
- **Le circuit de l'argent** — encaissement, commission, blocage des fonds, versement au loueur. Objet de SPEC-003.
- **Annulation, remboursement et réclamation** — objet de SPEC-004.
- **La reconduction automatique** — reportée en séance de brainstorm ; seules les dates fixes sont livrées d'abord.
- **La location à l'heure** — abandonnée en brainstorm, « trop galère à l'heure ».
- **Le boîtier d'accès connecté, le code de portail imposé** — écartés : l'accès est expliqué librement par le loueur, en texte.
- **Le back-office** — réservations, clients, statistiques, revenus, réglages : aucun écran d'administration n'est concerné par la publication d'une place.
- **La vérification d'identité et l'IBAN** — exigés avant le premier versement, jamais pour publier (RG-08).

## 11. Risques

- **L'adresse exacte et les dates de disponibilité sont publiques ensemble.** Une annonce indique alors qu'un box précis, à une adresse précise, est vide à des dates précises. · Signal précoce : des signalements de loueurs, ou des places dégradées ou occupées sans accord entre deux locations. · Parade : aucune, par décision explicite de JP à l'inversion de RG-05. · Gravité : moyenne.
- **Une grille à `0,00 €` est publiable.** Q-01 n'ayant posé ni plancher ni plafond, une location peut se conclure sans produire la moindre commission pour l'exploitant. · Signal précoce : la part des annonces actives dont un palier vaut `0,00 €`, et le revenu moyen par location. · Parade : aucune, conséquence assumée de Q-01. · Gravité : moyenne.
- **La seconde passe de récolte n'a pas eu lieu.** Les règles qu'on découvre en imaginant un utilisateur mécontent manquent ; la sonde de couverture est le seul filet. · Signal précoce : un défaut de publication qui ne se rattache à aucun exemple existant. · Parade : chaque défaut revient dans cette spec comme exemple manquant. · Gravité : moyenne.
- **L'accès est décrit en texte libre.** Ni vérifiable, ni opposable en cas de litige entre loueur et conducteur. · Signal précoce : des litiges « je n'ai pas pu entrer » dès les premières locations. · Parade : inconnue à ce stade. · Gravité : moyenne.
- **L'offre est le point dur d'une place de marché, pas la demande.** Publier doit rester si simple que l'absence d'identité vérifiée est déjà une parade (RG-08). · Signal précoce : le nombre de places publiées rapporté aux recherches sans résultat, et la part des annonces commencées jamais publiées. · Parade : publication sans aucune vérification préalable. · Gravité : forte.

## 12. Journal des révisions

| Révision | Date | Ce qui a changé |
|---|---|---|
| 1 | 16/09/2026 | Création. Issue de la séance d'example mapping ouverte le 10/09/2026 sur BR-20260910-reserver-et-louer-une-place : huit règles, trente-cinq exemples, trois écrans, cinq questions toutes résolues. |
| 2 | 17/09/2026 | Construction autonome de US-002 (AUTO-01) : RG-02 gagne EX-36 (un visiteur non connecté ne publie pas) et EX-37 (le loueur est le compte connecté, jamais un nom saisi) ; la cellule RG-02 × Autorisation passe de filet à exemples. |
| 3 | 17/09/2026 | Construction autonome de US-003 (AUTO-08) : RG-01 gagne EX-38 (un box écrit avec une espace en trop est le même box) et EX-39 (deux publications simultanées de la même place écrite autrement : une seule active) ; RG-01 × Concurrence passe à `EX-39 filet²`. |
| 4 | 17/09/2026 | Construction autonome de US-006 (AUTO-17) : RG-06 gagne EX-40, une période demandée au-delà de 366 jours est refusée ; RG-06 × Volume passe à `EX-40 filet²¹`. |
| 5 | 17/09/2026 | Construction autonome de US-006 (AUTO-19) : RG-06 gagne EX-41, une date de demande impossible est refusée ; RG-06 × Données passe d'`écarté¹⁷` à `EX-41`. |
| 6 | 17/09/2026 | Construction autonome de US-007 (AUTO-20) : §8 « Rétention » fixe douze mois puis anonymisation d'une annonce dépubliée, en réponse au constat de conformité laissé ouvert par AUTO-05. |
