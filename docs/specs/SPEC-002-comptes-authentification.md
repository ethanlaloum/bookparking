---
id: SPEC-002
titre: Comptes et authentification des loueurs et conducteurs
slug: comptes-authentification
statut: valide
revision: 2
derive_de: BR-20260919-comptes-authentification@3839b9c
amont: present
langue: fr
valide_le: 2026-09-20
valide_par: JP
apps: [api]
code_sha: { api: f7900eb }
ux: absent
regles: 7
exemples: 40
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-002 · Comptes et authentification des loueurs et conducteurs

## 1. Sujet

Pour un loueur et un conducteur, disposer d'un compte et d'une connexion par e-mail et mot de passe, afin que les routes que la garde protège déjà deviennent atteignables.

La carte sujet a été lue et validée telle quelle en séance. Le découpage tranché en séance donne à SPEC-002 le compte, la connexion, le jeton et le ralentissement des essais ; la suppression de compte part en SPEC-003 avec la dette #18, parce que les deux chemins d'anonymisation doivent être écrits ensemble.

## 2. Périmètre

**Dedans.** La création d'un compte à partir d'une adresse e-mail et d'un mot de passe, et l'unicité de l'adresse. La validité syntaxique de l'adresse, sans aucune vérification par e-mail. La connexion, le jeton qu'elle délivre, sa durée de sept jours glissants et son prolongement à chaque usage. Le fait qu'une connexion échouée ne révèle jamais si l'adresse existe. Le ralentissement progressif des essais après une série d'échecs, sans jamais verrouiller un compte. Le changement de mot de passe par un compte connecté. Le fait qu'un même compte publie et demande sans changer d'état ni de rôle, et que l'identité d'un demandeur vienne du jeton et non du corps de la requête.

**Dehors.** La suppression d'un compte et l'effacement de ses données personnelles, portées par SPEC-003 avec la dette #18. Le parcours « mot de passe oublié ». La vérification de l'adresse e-mail. La connexion par SMS, Google ou Apple. Le rôle déclaré à l'inscription. La révocation d'une session et la déconnexion côté serveur, qu'un jeton sans état rend sans objet. La publication d'une annonce et sa lecture publique, qui appartiennent à SPEC-001 et n'apparaissent ici que comme comportements dont l'accès change.

## 3. Glossaire

| Terme | Sens retenu, et à n'écrire que comme ça |
|---|---|
| Compte | l'identité unique d'une personne sur la plateforme, identifiée par son adresse e-mail. Jamais « utilisateur », jamais « profil ». |
| Loueur | le particulier qui met sa place en location et fixe sa grille tarifaire. Une action du compte, pas un type de compte. |
| Conducteur | celui qui cherche une place, la demande et s'y gare. Une action du compte, pas un type de compte. |
| Visiteur | celui qui consulte une annonce sans compte ni jeton. |
| Adresse e-mail | la donnée qui identifie le compte, unique sur l'ensemble des comptes. Jamais « identifiant », jamais « login ». |
| Mot de passe | le secret que la personne saisit pour se connecter. Jamais stocké tel quel. |
| Inscription | la création d'un compte. Jamais « enregistrement ». |
| Connexion | la présentation d'une adresse et d'un mot de passe qui délivre un jeton. Jamais « authentification » dans la prose produit. |
| Jeton | la preuve de connexion, valable sept jours glissants, prolongée à chaque usage. Jamais « session » : rien n'est stocké côté serveur et rien n'est révocable. |
| Garde | le mécanisme qui refuse toute requête sans jeton valide et attache le compte à la requête. Jamais confondue avec la délivrance du jeton. |
| Ralentissement | la réponse progressivement retardée aux échecs de connexion. Jamais « blocage », jamais « verrouillage » : aucun compte n'est jamais rendu inaccessible. |
| Annonce | la publication d'une place par son loueur, au sens de SPEC-001. |
| Demande | l'intention de location d'un conducteur, non encore acceptée, au sens de SPEC-001. |

## 4. Règles et exemples

Valeurs canoniques de cette spec : `Marc D.` loueur, `marc.d@example.com`, mot de passe `Barla2026!` ; `Léa T.` conductrice, `lea.t@example.com`, mot de passe `Promenade06!` ; la place `12 rue Barla, 06300 Nice`, `box 12` ; horloge `Europe/Paris`.

### RG-01 · s'inscrire demande une adresse e-mail et un mot de passe d'au moins 8 caractères ; l'adresse identifie le compte et ne peut pas être portée par deux comptes

#### EX-01 · une inscription crée un compte

Étant donné aucun compte pour `marc.d@example.com`
Quand `Marc D.` s'inscrit avec `marc.d@example.com` et `Barla2026!` le `01/10/2026 à 09:00`
Alors un compte est créé, identifié par `marc.d@example.com`
Et le mot de passe enregistré n'est pas `Barla2026!`
Et aucun e-mail n'est envoyé

<!-- jp-way:ex {"id":"EX-01","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"5011e387"} -->

#### EX-02 · une adresse déjà utilisée est refusée

Étant donné le compte de `Marc D.` sur `marc.d@example.com`
Quand quelqu'un s'inscrit avec `marc.d@example.com` et `Autre2026!`
Alors l'inscription est refusée avec `EmailAlreadyUsedError`
Et le compte existant n'est pas modifié

<!-- jp-way:ex {"id":"EX-02","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"1dc5d233"} -->

#### EX-03 · la même adresse écrite deux fois laisse un seul compte

Étant donné une base vide
Quand deux inscriptions pour `marc.d@example.com` sont écrites à la suite
Alors la table des comptes porte une seule ligne pour cette adresse
Et la seconde écriture remonte `EmailAlreadyUsedError`

<!-- jp-way:ex {"id":"EX-03","regle":"RG-01","origine":"mapping","barreau":"int-repo","empreinte":"a3a932d6"} -->

#### EX-04 · l'adresse déjà prise répond 409

Étant donné le compte de `Marc D.` sur `marc.d@example.com`
Quand `POST /account` porte `marc.d@example.com` et `Autre2026!`
Alors la réponse est `409`
Et le corps ne dit pas quel compte existe déjà

<!-- jp-way:ex {"id":"EX-04","regle":"RG-01","origine":"mapping","barreau":"int-http","empreinte":"22f94914"} -->

#### EX-05 · un mot de passe de 7 caractères est refusé

Quand `POST /account` porte `lea.t@example.com` et `Prom06!` (7 caractères)
Alors la réponse est `400`
Et aucun compte n'est créé

<!-- jp-way:ex {"id":"EX-05","regle":"RG-01","origine":"mapping","barreau":"int-http","empreinte":"bc3457cd"} -->

#### EX-06 · un mot de passe de 8 caractères est accepté

Quand `POST /account` porte `lea.t@example.com` et `Prom06!!` (8 caractères)
Alors la réponse est `201`
Et le compte de `lea.t@example.com` existe

<!-- jp-way:ex {"id":"EX-06","regle":"RG-01","origine":"mapping","barreau":"int-http","empreinte":"e65772f2"} -->

#### EX-07 · casse et espaces ne font pas deux comptes

Étant donné le compte de `Marc D.` sur `marc.d@example.com`
Quand quelqu'un s'inscrit avec ` Marc.D@Example.COM `
Alors l'inscription est refusée avec `EmailAlreadyUsedError`
Et aucun second compte n'existe pour cette adresse

<!-- jp-way:ex {"id":"EX-07","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"010fa706"} -->

#### EX-08 · la base tombe pendant l'inscription

Étant donné un dépôt de comptes qui échoue à l'écriture
Quand `Marc D.` s'inscrit avec `marc.d@example.com` et `Barla2026!`
Alors l'inscription est refusée avec `UnknownError`
Et aucun compte n'est créé

<!-- jp-way:ex {"id":"EX-08","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"0eff5431"} -->

#### EX-09 · un mot de passe vide est refusé

Quand `POST /account` porte `lea.t@example.com` et `` (chaîne vide) comme mot de passe
Alors la réponse est `400`
Et aucun compte n'est créé

<!-- jp-way:ex {"id":"EX-09","regle":"RG-01","origine":"sonde","barreau":"int-http","empreinte":"c94a0d4b"} -->

#### EX-10 · un mot de passe long avec accents et emoji est accepté

Quand `Léa T.` s'inscrit avec `lea.t@example.com` et un mot de passe de 200 caractères contenant `é`, `ü` et `🚗`
Alors le compte est créé
Et la connexion avec ce même mot de passe réussit

<!-- jp-way:ex {"id":"EX-10","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"aa12f003"} -->

### RG-02 · lire une annonce ne demande aucun compte ; publier et demander en demandent un, et l'identité vient du jeton, jamais du corps de la requête

#### EX-11 · un visiteur non connecté consulte l'annonce

Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand `GET /listing/{id}` est appelé sans en-tête `Authorization`
Alors la réponse est `200`
Et elle porte l'adresse, le box, les photos et la grille tarifaire

<!-- jp-way:ex {"id":"EX-11","regle":"RG-02","origine":"mapping","barreau":"int-http","empreinte":"8b52e94a"} -->

#### EX-12 · un visiteur non connecté ne peut pas demander la place

Étant donné la même annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice`
Quand `POST /rental-request` est appelé sans en-tête `Authorization`
Alors la réponse est `401`
Et aucune ligne n'est écrite dans `rental_requests`

<!-- jp-way:ex {"id":"EX-12","regle":"RG-02","origine":"mapping","barreau":"int-http","empreinte":"0824f80d"} -->

#### EX-13 · l'identité vient du jeton, jamais du corps

Étant donné `Léa T.` connectée avec un jeton valide
Quand `POST /rental-request` porte dans son corps `renterId` valant le compte de `Marc D.`
Alors la demande est enregistrée avec le compte de `Léa T.`
Et la valeur du corps est ignorée

<!-- jp-way:ex {"id":"EX-13","regle":"RG-02","origine":"mapping","barreau":"int-http","empreinte":"99c06490"} -->

### RG-03 · une connexion réussie délivre un jeton valable 7 jours, prolongé à chaque usage ; une connexion échouée ne dit jamais si c'est l'adresse ou le mot de passe qui est faux

#### EX-14 · une connexion réussie délivre un jeton

Étant donné le compte de `Marc D.` sur `marc.d@example.com` avec `Barla2026!`
Quand il se connecte le `01/10/2026 à 09:00`
Alors un jeton est délivré, valable jusqu'au `08/10/2026 à 09:00`

<!-- jp-way:ex {"id":"EX-14","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"e62194d6"} -->

#### EX-15 · un jeton utilisé juste avant la borne est prolongé

Étant donné un jeton délivré le `01/10/2026 à 09:00`
Quand il est présenté le `08/10/2026 à 08:59`
Alors il est accepté
Et sa validité court désormais jusqu'au `15/10/2026 à 08:59`

<!-- jp-way:ex {"id":"EX-15","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"b140c8eb"} -->

#### EX-16 · un jeton inutilisé sept jours est refusé

Étant donné un jeton délivré le `01/10/2026 à 09:00` et jamais présenté depuis
Quand il est présenté le `08/10/2026 à 09:01`
Alors la vérification renvoie `null`
Et aucun prolongement n'a lieu

<!-- jp-way:ex {"id":"EX-16","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"6ca2359a"} -->

#### EX-17 · un mot de passe faux ne dit pas que le compte existe

Étant donné le compte de `Marc D.` sur `marc.d@example.com`
Quand il se connecte avec `marc.d@example.com` et `Mauvais2026!`
Alors la connexion est refusée avec `InvalidCredentialsError`
Et aucun jeton n'est délivré

<!-- jp-way:ex {"id":"EX-17","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"2377fa7e"} -->

#### EX-18 · une adresse inconnue produit le même refus

Quand quelqu'un se connecte avec `inconnu@example.com` et `Barla2026!`
Alors la connexion est refusée avec `InvalidCredentialsError`, la même erreur qu'à EX-17
Et rien dans la réponse ne distingue une adresse inconnue d'un mot de passe faux

<!-- jp-way:ex {"id":"EX-18","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"c93f0dcb"} -->

#### EX-19 · sept jours se comptent en heures, pas en dates locales

Étant donné un jeton délivré le `23/10/2026 à 09:00`, avant le passage à l'heure d'hiver
Quand il est présenté le `30/10/2026 à 08:30`, après ce passage
Alors la vérification renvoie `null`, `168 h 30` s'étant écoulées depuis la délivrance
Et l'heure locale, qui affiche encore une demi-heure avant `J+7`, ne le prolonge pas

<!-- jp-way:ex {"id":"EX-19","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"55b7ef5d"} -->

### RG-04 · un même compte publie et demande sans changer d'état ni de rôle

#### EX-20 · le même compte publie puis demande

Étant donné `Marc D.` qui a publié son annonce du `box 12`
Quand il demande la place de `Léa T.` au `3 avenue Malausséna, 06000 Nice`, `box 4`
Alors la demande est enregistrée avec son compte
Et son compte n'est modifié en rien

<!-- jp-way:ex {"id":"EX-20","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"179b7ad1"} -->

#### EX-21 · un compte qui n'a jamais publié publie sans étape supplémentaire

Étant donné `Léa T.`, inscrite et connectée, qui n'a jamais publié
Quand elle publie une annonce pour le `3 avenue Malausséna, 06000 Nice`, `box 4`
Alors l'annonce est publiée
Et aucune activation ni changement de rôle n'a été nécessaire

<!-- jp-way:ex {"id":"EX-21","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"7fe6f4ff"} -->

### RG-05 · une série d'échecs de connexion ralentit les essais suivants sans jamais rendre un compte inaccessible

#### EX-22 · le troisième échec consécutif est retardé d'une seconde

Étant donné deux échecs de connexion sur `marc.d@example.com`
Quand un troisième échec survient
Alors la réponse est rendue après `1 s`
Et l'erreur reste `InvalidCredentialsError`

<!-- jp-way:ex {"id":"EX-22","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"6a649579"} -->

#### EX-23 · le délai plafonne à trente secondes

Étant donné huit échecs consécutifs sur `marc.d@example.com`
Quand un neuvième échec survient
Alors la réponse est rendue après `30 s`
Et le délai n'est pas `128 s`

<!-- jp-way:ex {"id":"EX-23","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"1fd21004"} -->

#### EX-24 · une connexion réussie remet le compteur à zéro

Étant donné cinq échecs sur `marc.d@example.com`
Quand la connexion réussit avec `Barla2026!`
Alors le compteur d'échecs retombe à `0`
Et l'essai suivant n'est pas retardé

<!-- jp-way:ex {"id":"EX-24","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"2597ce70"} -->

#### EX-25 · le compte n'est jamais verrouillé

Étant donné vingt échecs consécutifs sur `marc.d@example.com`
Quand `Marc D.` se connecte avec `Barla2026!`
Alors la connexion réussit
Et un jeton est délivré

<!-- jp-way:ex {"id":"EX-25","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"5e7b34c8"} -->

#### EX-26 · une même origine essayant plusieurs comptes est ralentie

Étant donné l'adresse `203.0.113.7` ayant échoué une fois sur chacun de cinq comptes différents
Quand elle tente un sixième compte
Alors la réponse est retardée, alors qu'aucun de ces comptes n'a atteint trois échecs

<!-- jp-way:ex {"id":"EX-26","regle":"RG-05","origine":"sonde","barreau":"unit","empreinte":"a241e755"} -->

#### EX-27 · le compteur retombe après quinze minutes sans essai

Étant donné cinq échecs sur `marc.d@example.com` dont le dernier le `01/10/2026 à 09:00`
Quand un échec survient le `01/10/2026 à 09:16`
Alors il compte pour un premier échec
Et il n'est pas retardé

<!-- jp-way:ex {"id":"EX-27","regle":"RG-05","origine":"sonde","barreau":"unit","empreinte":"94d5d460"} -->

#### EX-28 · deux essais simultanés comptent pour deux échecs

Étant donné deux échecs déjà enregistrés sur `marc.d@example.com`
Quand deux essais faux arrivent en même temps
Alors le compteur passe à `4`
Et il ne reste pas à `3`

<!-- jp-way:ex {"id":"EX-28","regle":"RG-05","origine":"sonde","barreau":"unit","empreinte":"73484439"} -->

### RG-06 · un compte connecté peut changer son mot de passe sans repasser par un e-mail

#### EX-29 · changer son mot de passe invalide l'ancien

Étant donné `Marc D.` connecté, mot de passe `Barla2026!`
Quand il le remplace par `Barla2027#`
Alors la connexion avec `Barla2026!` est refusée
Et la connexion avec `Barla2027#` réussit

<!-- jp-way:ex {"id":"EX-29","regle":"RG-06","origine":"mapping","barreau":"unit","empreinte":"c4858640"} -->

#### EX-30 · le changement exige l'ancien mot de passe

Étant donné `Marc D.` connecté, mot de passe `Barla2026!`
Quand il demande le remplacement en donnant `Mauvais2026!` comme mot de passe actuel
Alors la demande est refusée avec `InvalidCredentialsError`
Et le mot de passe reste `Barla2026!`

<!-- jp-way:ex {"id":"EX-30","regle":"RG-06","origine":"mapping","barreau":"unit","empreinte":"a3db9b63"} -->

#### EX-31 · un visiteur non connecté ne change aucun mot de passe

Quand `POST /account/password` est appelé sans en-tête `Authorization`
Alors la réponse est `401`
Et aucun mot de passe n'est modifié

<!-- jp-way:ex {"id":"EX-31","regle":"RG-06","origine":"mapping","barreau":"int-http","empreinte":"4d04fdb5"} -->

#### EX-32 · un nouveau mot de passe de 7 caractères est refusé

Étant donné `Marc D.` connecté, mot de passe `Barla2026!`
Quand il demande `Prom06!` comme nouveau mot de passe
Alors la demande est refusée
Et le mot de passe reste `Barla2026!`

<!-- jp-way:ex {"id":"EX-32","regle":"RG-06","origine":"sonde","barreau":"unit","empreinte":"3d3d0cdd"} -->

#### EX-33 · un jeton émis avant le changement reste valable

Étant donné `Marc D.` connecté le `01/10/2026 à 09:00`
Quand il change son mot de passe le `02/10/2026 à 10:00`
Alors le jeton délivré le `01/10` est toujours accepté le `02/10/2026 à 10:01`

<!-- jp-way:ex {"id":"EX-33","regle":"RG-06","origine":"sonde","barreau":"unit","empreinte":"aa74f913"} -->

### RG-07 · une adresse doit être syntaxiquement valide pour créer un compte ; aucune vérification par e-mail n'a lieu en v1

#### EX-34 · une adresse sans `@` est refusée

Quand `POST /account` porte `marc.d` et `Barla2026!`
Alors la réponse est `400`
Et aucun compte n'est créé

<!-- jp-way:ex {"id":"EX-34","regle":"RG-07","origine":"mapping","barreau":"int-http","empreinte":"e127673b"} -->

#### EX-35 · aucune vérification d'adresse n'a lieu

Quand `Marc D.` s'inscrit avec `marc.d@example.com`
Alors le compte est immédiatement utilisable pour publier
Et aucun e-mail n'est envoyé
Et aucun jeton de vérification n'est écrit

<!-- jp-way:ex {"id":"EX-35","regle":"RG-07","origine":"mapping","barreau":"unit","empreinte":"9a7c1934"} -->

#### EX-36 · une adresse de 255 caractères est refusée

Quand `POST /account` porte une adresse de 255 caractères
Alors la réponse est `400`
Et aucun compte n'est créé

<!-- jp-way:ex {"id":"EX-36","regle":"RG-07","origine":"sonde","barreau":"int-http","empreinte":"0dcb1c44"} -->

#### EX-37 · une adresse de 254 caractères est acceptée

Quand `POST /account` porte une adresse de 254 caractères, syntaxiquement valide
Alors la réponse est `201`

<!-- jp-way:ex {"id":"EX-37","regle":"RG-07","origine":"sonde","barreau":"int-http","empreinte":"f1ed5a6d"} -->

#### EX-38 · une adresse vide est refusée

Quand `POST /account` porte `` (chaîne vide) comme adresse
Alors la réponse est `400`
Et aucun compte n'est créé

<!-- jp-way:ex {"id":"EX-38","regle":"RG-07","origine":"sonde","barreau":"int-http","empreinte":"3b73fc29"} -->

#### EX-39 · une adresse accentuée est acceptée et normalisée

Quand `Léa T.` s'inscrit avec `Léa.T@Exemple.fr`
Alors le compte est créé sur la forme normalisée
Et une seconde inscription avec `léa.t@exemple.fr` est refusée avec `EmailAlreadyUsedError`

<!-- jp-way:ex {"id":"EX-39","regle":"RG-07","origine":"sonde","barreau":"unit","empreinte":"4930b02c"} -->

#### EX-40 · une tentative d'injection est refusée

Quand `POST /account` porte `marc'--@example.com`
Alors la réponse est `400`
Et aucun compte n'est créé

<!-- jp-way:ex {"id":"EX-40","regle":"RG-07","origine":"sonde","barreau":"int-http","empreinte":"60a9b317"} -->

## 5. Sonde de couverture

Sept règles croisées avec les dix dimensions : 70 intersections, toutes résolues — 25 cases portées par un exemple, 7 par un filet structurel, 38 écartées avec leur raison.

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | EX-05 EX-06 | EX-09 | écarté¹ | filet² | écarté³ | EX-02 | écarté⁴ | écarté⁵ | EX-08 | EX-10 |
| RG-02 | écarté⁶ | EX-12 | filet⁷ | écarté⁸ | EX-13 | EX-11 | écarté⁴ | écarté⁵ | écarté⁹ | filet¹⁰ |
| RG-03 | EX-15 | filet¹¹ | EX-19 | écarté¹² | EX-17 EX-18 | EX-16 | écarté⁴ | écarté⁵ | écarté⁹ | filet¹³ |
| RG-04 | écarté⁶ | EX-21 | écarté¹ | écarté¹⁴ | filet¹⁵ | EX-20 | écarté⁴ | écarté⁵ | écarté⁹ | écarté¹⁶ |
| RG-05 | EX-22 EX-23 | écarté¹⁷ | EX-27 | EX-28 | écarté¹⁸ | EX-24 EX-25 | écarté⁴ | EX-26 | écarté⁹ | écarté¹⁶ |
| RG-06 | EX-32 | écarté¹⁹ | écarté¹ | écarté²⁰ | EX-30 EX-31 | EX-29 EX-33 | écarté⁴ | écarté⁵ | écarté⁹ | filet²¹ |
| RG-07 | EX-36 EX-37 | EX-38 | écarté¹ | écarté²² | écarté²³ | écarté²⁴ | écarté⁴ | écarté⁵ | écarté²⁵ | EX-39 EX-40 |

¹ la règle ne lit aucune donnée temporelle.
² contrainte d'unicité en base sur l'adresse normalisée — même mécanisme que `listings_active_place_key_unique` (`apps/api/src/infra/migrations/20260917130000_enforce_unique_active_listing_place_key.ts`).
³ s'inscrire est ouvert à tout visiteur : aucune autorisation ne s'applique par construction.
⁴ aucun montant, aucune devise, aucune unité n'entre dans ce chemin.
⁵ la règle porte sur un compte à la fois ; aucune liste n'est lue ni rendue.
⁶ la règle est binaire — compte ou pas de compte — et ne porte aucune borne numérique.
⁷ l'expiration est portée par RG-03 et vérifiée par la garde (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:33-35`).
⁸ la règle ne lit ni n'écrit d'état partagé ; deux requêtes simultanées suivent chacune le même chemin.
⁹ aucun appel à un tiers dans ce chemin — aucun fournisseur d'e-mails n'existe en v1.
¹⁰ un jeton malformé fait renvoyer `null` par le vérificateur et la garde répond 401 (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:33-35`).
¹¹ jeton absent ou vide : la garde répond 401 avant toute vérification (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:27-31`).
¹² le jeton est sans état côté serveur : deux usages simultanés ne partagent aucune ligne.
¹³ un jeton tronqué ou modifié échoue à la vérification et renvoie `null` (`apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts:1-7`).
¹⁴ publier et demander écrivent dans deux tables distinctes, `listings` et `rental_requests`.
¹⁵ la garde fournit le même `request.user.id` quelle que soit l'action (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:37`).
¹⁶ la règle n'introduit aucune saisie libre.
¹⁷ un compteur d'échecs à zéro est le cas nominal, déjà couvert par EX-14.
¹⁸ le ralentissement s'applique avant toute authentification : il ne dépend d'aucun droit.
¹⁹ un champ absent produit le même refus de validation qu'un champ trop court, déjà EX-32.
²⁰ deux changements simultanés : le dernier écrit gagne, aucune règle ne dépend de l'ordre.
²¹ le mot de passe n'apparaît dans aucune réponse ni aucun journal — contrainte non fonctionnelle `## 8`.
²² la validation syntaxique est locale à la requête et ne lit aucun état partagé.
²³ la validation s'applique avant toute authentification.
²⁴ la validité syntaxique d'une adresse ne dépend d'aucun état du compte.
²⁵ aucun envoi d'e-mail n'a lieu en v1 : c'est précisément ce que la règle assume.

## 6. Écrans

Aucun. Le périmètre de cette spec ne porte aucune interface : le dépôt ne contient aucune application front — ni `apps/front`, ni `apps/bo`, ni `apps/e2e` — et `apps/api` est la seule app en périmètre. Les refus, les codes de statut et les délais décrits en `## 4` s'observent tous à la frontière HTTP. Le jour où une interface portera l'inscription et la connexion, cette section gagnera ses `UX-nn` et la spec une révision.

## 7. Questions

#### Q-01 · sans envoi d'e-mail en v1, l'adresse saisie à l'inscription n'est vérifiée par personne — que fait-on de l'unicité et de la validité de l'adresse ?

Statut : résolue — devient RG-07, tranché par JP en séance : l'adresse doit être syntaxiquement valide pour créer un compte, et aucune vérification par e-mail n'a lieu en v1.
Conséquence appliquée : RG-07 est écrite en ces termes et porte EX-34 à EX-40 ; l'adresse reste l'identifiant unique du compte (RG-01, D-08) sans jamais être prouvée. Le risque que cela ouvre — quiconque saisit l'adresse d'un autre la lui confisque, sans recours puisque D-03 écarte le mot de passe oublié — est porté en `## 11` en gravité forte.

## 8. Contraintes non fonctionnelles

- **Secret.** Le mot de passe n'est jamais stocké en clair, jamais journalisé, jamais renvoyé dans une réponse. Ni l'ancien ni le nouveau lors d'un changement.
- **Indistinction du refus.** Une connexion échouée ne distingue jamais une adresse inconnue d'un mot de passe faux, ni par le message, ni par le délai. Le ralentissement de RG-05 s'applique de la même manière dans les deux cas.
- **Conformité RGPD.** L'adresse e-mail est une donnée personnelle (`quality.compliance.dataClasses: pii`). Sa conservation suit celle du compte ; l'effacement est porté par SPEC-003, pas ici.
- **Sous-traitants.** Aucun envoi d'e-mail en v1, donc aucun destinataire tiers de données personnelles à déclarer pour ce périmètre.
- **Limitation de débit.** Aucune limitation de débit générale n'existe dans le dépôt (constat repris de SPEC-001, AUTO-30). Le ralentissement de RG-05 est le premier mécanisme du genre et ne couvre que la connexion : ni l'inscription, ni le changement de mot de passe, ni les routes de SPEC-001.
- **Temps.** La validité d'un jeton se compte en heures depuis son dernier usage, jamais en dates locales : un changement d'heure décale donc l'échéance sur l'horloge locale, et un jeton peut expirer alors que l'heure locale affiche encore moins de sept jours (EX-19).
- **Langue.** Tout ce qu'un loueur ou un conducteur lit est en français.

## 9. Impacts par app

| App | Ce qui bouge | Ce qui ne bouge pas |
|---|---|---|
| api | un nouveau contexte de comptes — entité, dépôt, migration ; l'implémentation de `AccessTokenVerifier`, dont seul le contrat existe (`apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts:1-7`) ; les routes d'inscription, de connexion et de changement de mot de passe ; le ralentissement des essais ; et le passage du demandeur sur le compte connecté dans `RequestRental`, qui prend aujourd'hui un `renterId` en champ libre (`apps/api/src/rental/domain/usecases/request-rental/RequestRental.ts:15-22`). | le contrat de la garde (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:21-39`) et celui de `AccessTokenVerifier`, la publication d'une annonce, la lecture publique d'une annonce. |

`apps/front`, `apps/bo` et `apps/e2e` n'existent pas dans le dépôt : aucune de ces apps n'est concernée.

## 10. Hors sujet

- **La suppression de compte et l'effacement des données** — partent en SPEC-003 avec la dette #18, par décision de séance : les deux chemins d'anonymisation touchent les mêmes tables et doivent être écrits ensemble. C'est la parade de R-07 du brainstorm.
- **Le parcours « mot de passe oublié »** — écarté par D-03 : il suppose un fournisseur d'e-mails qui n'existe pas en v1.
- **La vérification de l'adresse e-mail** — assumée par RG-07 : aucune vérification en v1.
- **La connexion par SMS, Google ou Apple** — écartées en séance de phase 1 au profit du mot de passe.
- **Le rôle déclaré à l'inscription** — écarté par D-05 : la donnée serait fausse dès qu'un conducteur publie.
- **La révocation de session, la table de sessions, la déconnexion côté serveur** — écartées par D-04 : le jeton est sans état, il n'y a rien à révoquer.

## 11. Risques

- **Un jeton volé reste utilisable jusqu'à sept jours, sans révocation possible.** · Signal précoce : aucun aujourd'hui, rien ne journalise les connexions. · Parade : aucune en v1, conséquence assumée de D-04 ; à revoir quand l'argent entrera. · Gravité : moyenne.
- **Un jeton émis avant un changement de mot de passe reste valable jusqu'à son expiration (EX-33).** Changer son mot de passe ne coupe donc pas un accès déjà ouvert. · Signal précoce : un utilisateur qui change son mot de passe après un vol et reste compromis. · Parade : aucune en v1, conséquence directe du jeton sans état. · Gravité : moyenne.
- **L'adresse identifie le compte sans être vérifiée (RG-07) et aucun recours n'existe (D-03).** Quiconque saisit l'adresse d'un autre la lui confisque. · Signal précoce : « mon adresse est déjà prise » au support. · Parade : aucune en v1. · Gravité : forte.
- **Une attaque lente et répartie passe sous le ralentissement de RG-05.** · Signal précoce : aucun aujourd'hui, rien ne journalise les échecs. · Parade : partielle, le ralentissement seul. · Gravité : moyenne.
- **Un utilisateur enfermé dehors doit passer par une réinitialisation manuelle en base.** · Signal précoce : les demandes de réinitialisation. · Parade : aucune en v1, D-03 à revalider. · Gravité : moyenne.
- **Aucun test n'exerce la vraie garde aujourd'hui**, `TestAuthGuard` la remplace toujours (`apps/api/src/shared/test/http/TestAuthGuard.ts:11-28`). L'implémentation de `AccessTokenVerifier` doit donc venir avec une preuve qui passe par la vraie garde. · Signal précoce : une régression de la garde que rien ne voit. · Gravité : moyenne.

## 12. Journal des révisions

| Révision | Date | Ce qui a changé |
|---|---|---|
| 1 | 20/09/2026 | Création. Issue de la séance d'example mapping ouverte le 19/09/2026 sur BR-20260919-comptes-authentification : sept règles, quarante exemples, aucun écran, une question héritée de la phase 1 et résolue en séance. La suppression de compte, présente dans le périmètre du distillat, est sortie en SPEC-003 par décision de séance. |
| 2 | 20/09/2026 | EX-19 réécrit. Les deux instants de la version 1 (`25/10/2026 09:00` et `01/11/2026 08:30`) étaient tous deux en heure d'hiver : aucun changement d'heure n'était traversé, et la règle « en heures » comme la règle « en dates locales » donnaient la même limite, de sorte que l'exemple ne pouvait pas échouer. Remplacé par `23/10/2026 09:00` → `30/10/2026 08:30`, qui encadre le passage du 25/10 : l'issue devient un refus. La contrainte temporelle du §8 est reformulée en conséquence. Défaut relevé à la porte de phase 3, corrigé sur demande. |
